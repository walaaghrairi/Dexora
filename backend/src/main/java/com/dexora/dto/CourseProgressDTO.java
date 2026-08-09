package com.dexora.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressDTO {

    private Long id;

    @NotNull
    private Double percentCompleted;

    @NotNull
    private Integer signsRemaining;

    private LocalDateTime lastUpdatedAt;

    private boolean completed;

    private LocalDateTime completedAt;

    private Long userId;

    private Long courseId;
}
