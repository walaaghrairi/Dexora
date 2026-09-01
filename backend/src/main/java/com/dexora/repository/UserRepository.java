package com.dexora.repository;

import com.dexora.entity.User;
import com.dexora.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSubject(String googleSubject);

    boolean existsByEmail(String email);

    long countByActiveTrue();

    long countByEmailVerifiedTrue();

    long countByTwoFactorEnabledTrue();

    long countByRole(Role role);
}
