package com.dexora.mapper;

import com.dexora.dto.UserProgressDTO;
import com.dexora.entity.Sign;
import com.dexora.entity.User;
import com.dexora.entity.UserProgress;

public class UserProgressMapper {

    public static UserProgressDTO toDTO(UserProgress entity) {
        if (entity == null) {
            return null;
        }
        return UserProgressDTO.builder()
                .id(entity.getId())
                .completed(entity.isCompleted())
                .bestScore(entity.getBestScore())
                .lastPracticedAt(entity.getLastPracticedAt())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .signId(entity.getSign() != null ? entity.getSign().getId() : null)
                .build();
    }

    public static UserProgress toEntity(UserProgressDTO dto) {
        if (dto == null) {
            return null;
        }
        UserProgress entity = new UserProgress();
        entity.setId(dto.getId());
        entity.setCompleted(dto.isCompleted());
        entity.setBestScore(dto.getBestScore());
        entity.setLastPracticedAt(dto.getLastPracticedAt());

        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            entity.setUser(user);
        }

        if (dto.getSignId() != null) {
            Sign sign = new Sign();
            sign.setId(dto.getSignId());
            entity.setSign(sign);
        }

        return entity;
    }
}
