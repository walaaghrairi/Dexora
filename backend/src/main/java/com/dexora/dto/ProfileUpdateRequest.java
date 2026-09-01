package com.dexora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @NotBlank
    @Size(max = 80)
    private String firstName;

    @NotBlank
    @Size(max = 80)
    private String lastName;

    @Email
    @NotBlank
    @Size(max = 254)
    private String email;

    @Pattern(regexp = "signer|scholar|explorer", message = "Avatar non autorisé.")
    private String avatarKey;
}
