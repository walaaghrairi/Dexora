package com.dexora.mapper;

import com.dexora.dto.UserPathDTO;
import com.dexora.entity.Path;
import com.dexora.entity.User;
import com.dexora.entity.UserPath;

public class UserPathMapper {

    public static UserPathDTO toDTO(UserPath entity) {
        if (entity == null) {
            return null;
        }
        return UserPathDTO.builder()
                .id(entity.getId())
                .enrolledAt(entity.getEnrolledAt())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .pathId(entity.getPath() != null ? entity.getPath().getId() : null)
                .build();
    }

    public static UserPath toEntity(UserPathDTO dto) {
        if (dto == null) {
            return null;
        }
        UserPath entity = new UserPath();
        entity.setId(dto.getId());
        entity.setEnrolledAt(dto.getEnrolledAt());

        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            entity.setUser(user);
        }

        if (dto.getPathId() != null) {
            Path path = new Path();
            path.setId(dto.getPathId());
            entity.setPath(path);
        }

        return entity;
    }
}
