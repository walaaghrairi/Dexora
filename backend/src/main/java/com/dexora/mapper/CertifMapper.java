package com.dexora.mapper;

import com.dexora.dto.CertifDTO;
import com.dexora.entity.Certif;

public class CertifMapper {

    public static CertifDTO toDTO(Certif entity) {
        if (entity == null) {
            return null;
        }
        return CertifDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static Certif toEntity(CertifDTO dto) {
        if (dto == null) {
            return null;
        }
        Certif entity = new Certif();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
