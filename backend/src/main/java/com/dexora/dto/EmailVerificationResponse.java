package com.dexora.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationResponse {
    private boolean verified;
    private boolean emailSent;
    private String message;
    private String developmentVerificationUrl;
}
