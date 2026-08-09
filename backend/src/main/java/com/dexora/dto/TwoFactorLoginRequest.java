package com.dexora.dto;

import lombok.Data;

@Data
public class TwoFactorLoginRequest {
    private String email;
    private String code;
}
