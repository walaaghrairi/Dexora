package com.dexora.repository;

import com.dexora.entity.IssuedCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IssuedCertificateRepository extends JpaRepository<IssuedCertificate, Long> {
    Optional<IssuedCertificate> findByVerificationCode(String verificationCode);

    Optional<IssuedCertificate> findByUserIdAndCourseId(Long userId, Long courseId);
}
