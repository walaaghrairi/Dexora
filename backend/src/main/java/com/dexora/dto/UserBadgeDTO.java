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
public class UserBadgeDTO {

    private Long id;

    @NotNull
    private LocalDateTime awardedAt;

    private Long userId;

    private Long badgeId;

    private Long courseId;
}
