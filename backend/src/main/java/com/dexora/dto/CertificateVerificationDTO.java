package com.dexora.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateVerificationDTO {
    private boolean valid;
    private String status;
    private String verificationCode;
    private String studentName;
    private Long courseId;
    private String courseTitle;
    private Instant issuedAt;
    private Integer earnedBadges;
    private Integer requiredBadges;
    private String digitalSignature;
    private String signatureAlgorithm;
    private String publicKeyFingerprint;
    private String verificationUrl;
    private String qrCodeDataUrl;
}
