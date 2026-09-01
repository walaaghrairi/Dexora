package com.dexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TwoFactorCodeRequest {
    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "Le code doit contenir exactement 6 chiffres.")
    private String code;
}
