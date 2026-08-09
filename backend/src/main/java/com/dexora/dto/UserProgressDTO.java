package com.dexora.dto;

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
public class UserProgressDTO {

    private Long id;

    private boolean completed;

    private Double bestScore;

    private LocalDateTime lastPracticedAt;

    private Long userId;

    private Long signId;
}
