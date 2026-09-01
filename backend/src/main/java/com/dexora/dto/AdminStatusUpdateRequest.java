package com.dexora.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminStatusUpdateRequest {
    @NotNull
    private Boolean active;
}
