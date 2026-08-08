package com.dexora.repository;

import com.dexora.entity.UserCertif;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCertifRepository extends JpaRepository<UserCertif, Long> {
}