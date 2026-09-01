package com.dexora.service;

import com.dexora.dto.AdminDashboardStats;
import com.dexora.dto.UserResponseDTO;
import com.dexora.enums.Role;

import java.util.List;

public interface AdminService {
    AdminDashboardStats dashboardStats();
    List<UserResponseDTO> users();
    UserResponseDTO updateRole(Long userId, Role role, String administratorEmail);
    UserResponseDTO updateStatus(Long userId, boolean active, String administratorEmail);
}
