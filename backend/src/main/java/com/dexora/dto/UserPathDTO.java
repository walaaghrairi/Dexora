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
public class UserPathDTO {

    private Long id;

    @NotNull
    private LocalDateTime enrolledAt;

    private Long userId;

    private Long pathId;
}
