package com.dexora.mapper;

import com.dexora.dto.UserDTO;
import com.dexora.entity.User;

public class UserMapper {

    public static UserDTO toDTO(User entity) {
        if (entity == null) {
            return null;
        }
        return UserDTO.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .email(entity.getEmail())
                .hashPassword(entity.getHashPassword())
                .role(entity.getRole())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }
        User entity = new User();
        entity.setId(dto.getId());
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setEmail(dto.getEmail());
        entity.setHashPassword(dto.getHashPassword());
        entity.setRole(dto.getRole());
        entity.setCreatedAt(dto.getCreatedAt());
        return entity;
    }
}
