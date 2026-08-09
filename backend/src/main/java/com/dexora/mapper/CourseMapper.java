package com.dexora.mapper;

import com.dexora.dto.CourseDTO;
import com.dexora.entity.Category;
import com.dexora.entity.Course;
import com.dexora.entity.Path;

public class CourseMapper {

    public static CourseDTO toDTO(Course entity) {
        if (entity == null) {
            return null;
        }
        return CourseDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .pathId(entity.getPath() != null ? entity.getPath().getId() : null)
                .build();
    }

    public static Course toEntity(CourseDTO dto) {
        if (dto == null) {
            return null;
        }
        Course entity = new Course();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setCreatedAt(dto.getCreatedAt());

        if (dto.getCategoryId() != null) {
            Category category = new Category();
            category.setId(dto.getCategoryId());
            entity.setCategory(category);
        }

        if (dto.getPathId() != null) {
            Path path = new Path();
            path.setId(dto.getPathId());
            entity.setPath(path);
        }

        return entity;
    }
}
