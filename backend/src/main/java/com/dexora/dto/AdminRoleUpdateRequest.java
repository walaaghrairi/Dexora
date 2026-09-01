package com.dexora.dto;

import com.dexora.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminRoleUpdateRequest {
    @NotNull
    private Role role;
}
