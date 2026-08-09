package com.dexora.mapper;

import com.dexora.dto.BadgeDTO;
import com.dexora.entity.Badge;

public class BadgeMapper {

    public static BadgeDTO toDTO(Badge entity) {
        if (entity == null) {
            return null;
        }
        return BadgeDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static Badge toEntity(BadgeDTO dto) {
        if (dto == null) {
            return null;
        }
        Badge entity = new Badge();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
