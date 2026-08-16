package com.dexora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "certificate_signing_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CertificateSigningKey {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String privateKeyBase64;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String publicKeyBase64;

    @Column(nullable = false, length = 40)
    private String algorithm;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
