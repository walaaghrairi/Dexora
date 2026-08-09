package com.dexora.mapper;

import com.dexora.dto.PathDTO;
import com.dexora.entity.Path;

public class PathMapper {

    public static PathDTO toDTO(Path entity) {
        if (entity == null) {
            return null;
        }
        return PathDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static Path toEntity(PathDTO dto) {
        if (dto == null) {
            return null;
        }
        Path entity = new Path();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
