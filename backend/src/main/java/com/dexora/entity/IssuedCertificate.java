package com.dexora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "issued_certificates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_certificate_verification_code", columnNames = "verification_code"),
                @UniqueConstraint(name = "uk_certificate_user_course", columnNames = {"user_id", "course_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IssuedCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "verification_code", nullable = false, updatable = false, length = 36)
    private String verificationCode;

    @Column(nullable = false, updatable = false, length = 512)
    private String digitalSignature;

    @Column(nullable = false, updatable = false, length = 64)
    private String signingKeyId;

    @Column(nullable = false, updatable = false, length = 64)
    private String publicKeyFingerprint;

    @Column(nullable = false, updatable = false)
    private String studentName;

    @Column(nullable = false, updatable = false)
    private String courseTitle;

    @Column(nullable = false, updatable = false)
    private Integer earnedBadges;

    @Column(nullable = false, updatable = false)
    private Integer requiredBadges;

    @Column(nullable = false, updatable = false)
    private Instant issuedAt;

    @Column(nullable = false)
    private boolean revoked;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false, updatable = false)
    private Course course;
}
