package com.dexora.repository;

import com.dexora.entity.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    long countByCompletedTrue();
}
