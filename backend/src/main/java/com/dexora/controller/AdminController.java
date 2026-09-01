package com.dexora.controller;

import com.dexora.dto.AdminDashboardStats;
import com.dexora.dto.AdminRoleUpdateRequest;
import com.dexora.dto.AdminStatusUpdateRequest;
import com.dexora.dto.UserResponseDTO;
import com.dexora.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStats> stats() {
        return ResponseEntity.ok(adminService.dashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> users() {
        return ResponseEntity.ok(adminService.users());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponseDTO> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminRoleUpdateRequest request,
            @AuthenticationPrincipal UserDetails administrator) {
        return ResponseEntity.ok(adminService.updateRole(id, request.getRole(), administrator.getUsername()));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserResponseDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails administrator) {
        return ResponseEntity.ok(adminService.updateStatus(id, request.getActive(), administrator.getUsername()));
    }
}
