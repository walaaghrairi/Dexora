package com.dexora.repository;

import com.dexora.entity.Sign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SignRepository extends JpaRepository<Sign, Long> {
    Optional<Sign> findByModelLabel(String modelLabel);
}
