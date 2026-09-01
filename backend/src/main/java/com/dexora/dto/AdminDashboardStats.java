package com.dexora.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardStats {
    private long totalUsers;
    private long activeUsers;
    private long verifiedUsers;
    private long twoFactorUsers;
    private long students;
    private long teachers;
    private long admins;
    private long categories;
    private long courses;
    private long signs;
    private long completedCourses;
    private long awardedBadges;
    private long issuedCertificates;
}
