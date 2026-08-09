package com.dexora.mapper;

import com.dexora.dto.CategoryDTO;
import com.dexora.entity.Category;

public class CategoryMapper {

    public static CategoryDTO toDTO(Category entity) {
        if (entity == null) {
            return null;
        }
        return CategoryDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static Category toEntity(CategoryDTO dto) {
        if (dto == null) {
            return null;
        }
        Category entity = new Category();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
