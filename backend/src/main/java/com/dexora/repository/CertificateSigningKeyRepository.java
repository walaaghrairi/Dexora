package com.dexora.repository;

import com.dexora.entity.CertificateSigningKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateSigningKeyRepository extends JpaRepository<CertificateSigningKey, String> {
}
