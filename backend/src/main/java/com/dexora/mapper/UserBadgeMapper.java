package com.dexora.mapper;

import com.dexora.dto.UserBadgeDTO;
import com.dexora.entity.Badge;
import com.dexora.entity.Course;
import com.dexora.entity.User;
import com.dexora.entity.UserBadge;

public class UserBadgeMapper {

    public static UserBadgeDTO toDTO(UserBadge entity) {
        if (entity == null) {
            return null;
        }
        return UserBadgeDTO.builder()
                .id(entity.getId())
                .awardedAt(entity.getAwardedAt())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .badgeId(entity.getBadge() != null ? entity.getBadge().getId() : null)
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .build();
    }

    public static UserBadge toEntity(UserBadgeDTO dto) {
        if (dto == null) {
            return null;
        }
        UserBadge entity = new UserBadge();
        entity.setId(dto.getId());
        entity.setAwardedAt(dto.getAwardedAt());

        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            entity.setUser(user);
        }

        if (dto.getBadgeId() != null) {
            Badge badge = new Badge();
            badge.setId(dto.getBadgeId());
            entity.setBadge(badge);
        }

        if (dto.getCourseId() != null) {
            Course course = new Course();
            course.setId(dto.getCourseId());
            entity.setCourse(course);
        }

        return entity;
    }
}
