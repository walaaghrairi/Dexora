package com.dexora.mapper;

import com.dexora.dto.SignDTO;
import com.dexora.entity.Course;
import com.dexora.entity.Sign;

public class SignMapper {

    public static SignDTO toDTO(Sign entity) {
        if (entity == null) {
            return null;
        }
        return SignDTO.builder()
                .id(entity.getId())
                .word(entity.getWord())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .videoUrl(entity.getVideoUrl())
                .difficulty(entity.getDifficulty())
                .modelLabel(entity.getModelLabel())
                .createdAt(entity.getCreatedAt())
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .build();
    }

    public static Sign toEntity(SignDTO dto) {
        if (dto == null) {
            return null;
        }
        Sign entity = new Sign();
        entity.setId(dto.getId());
        entity.setWord(dto.getWord());
        entity.setDescription(dto.getDescription());
        entity.setImageUrl(dto.getImageUrl());
        entity.setVideoUrl(dto.getVideoUrl());
        entity.setDifficulty(dto.getDifficulty());
        entity.setModelLabel(dto.getModelLabel());
        entity.setCreatedAt(dto.getCreatedAt());

        if (dto.getCourseId() != null) {
            Course course = new Course();
            course.setId(dto.getCourseId());
            entity.setCourse(course);
        }

        return entity;
    }
}
