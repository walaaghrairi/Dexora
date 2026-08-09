package com.dexora.dto;

import com.dexora.enums.Difficulty;
import jakarta.validation.constraints.NotBlank;
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
public class SignDTO {

    private Long id;

    @NotBlank
    private String word;

    private String description;

    private String imageUrl;

    private String videoUrl;

    private Difficulty difficulty;

    @NotBlank
    private String modelLabel;

    private LocalDateTime createdAt;

    private Long courseId;
}
