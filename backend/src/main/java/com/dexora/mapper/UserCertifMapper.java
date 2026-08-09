package com.dexora.mapper;

import com.dexora.dto.UserCertifDTO;
import com.dexora.entity.Certif;
import com.dexora.entity.Path;
import com.dexora.entity.User;
import com.dexora.entity.UserCertif;

public class UserCertifMapper {

    public static UserCertifDTO toDTO(UserCertif entity) {
        if (entity == null) {
            return null;
        }
        return UserCertifDTO.builder()
                .id(entity.getId())
                .awardedAt(entity.getAwardedAt())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .certifId(entity.getCertif() != null ? entity.getCertif().getId() : null)
                .pathId(entity.getPath() != null ? entity.getPath().getId() : null)
                .build();
    }

    public static UserCertif toEntity(UserCertifDTO dto) {
        if (dto == null) {
            return null;
        }
        UserCertif entity = new UserCertif();
        entity.setId(dto.getId());
        entity.setAwardedAt(dto.getAwardedAt());

        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            entity.setUser(user);
        }

        if (dto.getCertifId() != null) {
            Certif certif = new Certif();
            certif.setId(dto.getCertifId());
            entity.setCertif(certif);
        }

        if (dto.getPathId() != null) {
            Path path = new Path();
            path.setId(dto.getPathId());
            entity.setPath(path);
        }

        return entity;
    }
}
