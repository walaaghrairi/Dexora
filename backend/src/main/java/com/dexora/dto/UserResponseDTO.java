package com.dexora.dto;

import com.dexora.enums.Role;
import com.dexora.enums.AuthProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private boolean twoFactorEnabled;
    private String avatarKey;
    private boolean emailVerified;
    private boolean active;
    private AuthProvider authProvider;
}
