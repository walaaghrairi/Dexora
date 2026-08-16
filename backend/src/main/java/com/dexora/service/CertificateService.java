package com.dexora.service;

import com.dexora.dto.CertificateVerificationDTO;
import com.dexora.entity.Course;
import com.dexora.entity.IssuedCertificate;
import com.dexora.entity.User;
import com.dexora.exception.CertificateEligibilityException;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.repository.CourseRepository;
import com.dexora.repository.IssuedCertificateRepository;
import com.dexora.repository.SignRepository;
import com.dexora.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final IssuedCertificateRepository certificateRepository;
    private final CertificateSigningService signingService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SignRepository signRepository;

    @Value("${application.certificate.public-base-url:http://localhost:5173}")
    private String publicBaseUrl;

    @Transactional
    public CertificateVerificationDTO issue(String email, Long courseId, int earnedBadges) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Cours introuvable"));

        return certificateRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .map(this::toVerificationDTO)
                .orElseGet(() -> issueNewCertificate(user, course, earnedBadges));
    }

    @Transactional(readOnly = true)
    public CertificateVerificationDTO verify(String verificationCode) {
        return certificateRepository.findByVerificationCode(verificationCode)
                .map(this::toVerificationDTO)
                .orElseGet(() -> invalidResponse(verificationCode, "CERTIFICATE_NOT_FOUND"));
    }

    private CertificateVerificationDTO issueNewCertificate(User user, Course course, int earnedBadges) {
        int requiredBadges = Math.toIntExact(signRepository.countByCourseId(course.getId()));
        if (requiredBadges <= 0) {
            throw new CertificateEligibilityException("Ce cours ne contient encore aucune leçon certifiable.");
        }
        if (earnedBadges < requiredBadges) {
            throw new CertificateEligibilityException(
                    "Tous les badges sont requis : " + earnedBadges + " obtenu(s) sur " + requiredBadges + "."
            );
        }

        IssuedCertificate certificate = new IssuedCertificate();
        certificate.setVerificationCode(UUID.randomUUID().toString());
        certificate.setSigningKeyId(CertificateSigningService.PRIMARY_KEY_ID);
        certificate.setPublicKeyFingerprint(signingService.primaryPublicKeyFingerprint());
        certificate.setStudentName((user.getFirstName() + " " + user.getLastName()).trim());
        certificate.setCourseTitle(course.getTitle());
        certificate.setEarnedBadges(requiredBadges);
        certificate.setRequiredBadges(requiredBadges);
        // PostgreSQL stores timestamps with microsecond precision. Normalize before signing so
        // the canonical payload is byte-for-byte identical after a database round trip.
        certificate.setIssuedAt(Instant.now().truncatedTo(ChronoUnit.MICROS));
        certificate.setRevoked(false);
        certificate.setUser(user);
        certificate.setCourse(course);
        certificate.setDigitalSignature(signingService.sign(canonicalPayload(certificate)));

        return toVerificationDTO(certificateRepository.save(certificate));
    }

    private CertificateVerificationDTO toVerificationDTO(IssuedCertificate certificate) {
        boolean valid = !certificate.isRevoked()
                && signingService.verify(
                        certificate.getSigningKeyId(),
                        canonicalPayload(certificate),
                        certificate.getDigitalSignature()
                );
        String verificationUrl = verificationUrl(certificate.getVerificationCode());

        return CertificateVerificationDTO.builder()
                .valid(valid)
                .status(valid ? "AUTHENTIC" : certificate.isRevoked() ? "REVOKED" : "INVALID_SIGNATURE")
                .verificationCode(certificate.getVerificationCode())
                .studentName(certificate.getStudentName())
                .courseId(certificate.getCourse().getId())
                .courseTitle(certificate.getCourseTitle())
                .issuedAt(certificate.getIssuedAt())
                .earnedBadges(certificate.getEarnedBadges())
                .requiredBadges(certificate.getRequiredBadges())
                .digitalSignature(certificate.getDigitalSignature())
                .signatureAlgorithm(CertificateSigningService.SIGNATURE_ALGORITHM)
                .publicKeyFingerprint(certificate.getPublicKeyFingerprint())
                .verificationUrl(verificationUrl)
                .qrCodeDataUrl(qrCodeDataUrl(verificationUrl))
                .build();
    }

    private CertificateVerificationDTO invalidResponse(String code, String status) {
        return CertificateVerificationDTO.builder()
                .valid(false)
                .status(status)
                .verificationCode(code)
                .verificationUrl(verificationUrl(code))
                .build();
    }

    private String canonicalPayload(IssuedCertificate certificate) {
        return String.join("|",
                certificate.getVerificationCode(),
                String.valueOf(certificate.getUser().getId()),
                String.valueOf(certificate.getCourse().getId()),
                certificate.getStudentName(),
                certificate.getCourseTitle(),
                certificate.getIssuedAt().toString(),
                String.valueOf(certificate.getEarnedBadges()),
                String.valueOf(certificate.getRequiredBadges())
        );
    }

    private String verificationUrl(String code) {
        return publicBaseUrl.replaceAll("/+$", "") + "/verify-certificate/" + code;
    }

    private String qrCodeDataUrl(String value) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 260, 260);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de générer le QR code", exception);
        }
    }
}
