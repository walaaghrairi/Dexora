package com.dexora.mapper;

import com.dexora.dto.CourseProgressDTO;
import com.dexora.entity.Course;
import com.dexora.entity.CourseProgress;
import com.dexora.entity.User;

public class CourseProgressMapper {

    public static CourseProgressDTO toDTO(CourseProgress entity) {
        if (entity == null) {
            return null;
        }
        return CourseProgressDTO.builder()
                .id(entity.getId())
                .percentCompleted(entity.getPercentCompleted())
                .signsRemaining(entity.getSignsRemaining())
                .lastUpdatedAt(entity.getLastUpdatedAt())
                .completed(entity.isCompleted())
                .completedAt(entity.getCompletedAt())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .build();
    }

    public static CourseProgress toEntity(CourseProgressDTO dto) {
        if (dto == null) {
            return null;
        }
        CourseProgress entity = new CourseProgress();
        entity.setId(dto.getId());
        entity.setPercentCompleted(dto.getPercentCompleted());
        entity.setSignsRemaining(dto.getSignsRemaining());
        entity.setLastUpdatedAt(dto.getLastUpdatedAt());
        entity.setCompleted(dto.isCompleted());
        entity.setCompletedAt(dto.getCompletedAt());

        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            entity.setUser(user);
        }

        if (dto.getCourseId() != null) {
            Course course = new Course();
            course.setId(dto.getCourseId());
            entity.setCourse(course);
        }

        return entity;
    }
}
