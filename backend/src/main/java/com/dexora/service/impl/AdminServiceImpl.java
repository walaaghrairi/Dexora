package com.dexora.service.impl;

import com.dexora.dto.AdminDashboardStats;
import com.dexora.dto.UserResponseDTO;
import com.dexora.entity.User;
import com.dexora.enums.Role;
import com.dexora.mapper.UserMapper;
import com.dexora.repository.CategoryRepository;
import com.dexora.repository.CourseProgressRepository;
import com.dexora.repository.CourseRepository;
import com.dexora.repository.IssuedCertificateRepository;
import com.dexora.repository.SignRepository;
import com.dexora.repository.UserBadgeRepository;
import com.dexora.repository.UserRepository;
import com.dexora.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final SignRepository signRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final IssuedCertificateRepository issuedCertificateRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStats dashboardStats() {
        return AdminDashboardStats.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByActiveTrue())
                .verifiedUsers(userRepository.countByEmailVerifiedTrue())
                .twoFactorUsers(userRepository.countByTwoFactorEnabledTrue())
                .students(userRepository.countByRole(Role.STUDENT))
                .teachers(userRepository.countByRole(Role.TEACHER))
                .admins(userRepository.countByRole(Role.ADMIN))
                .categories(categoryRepository.count())
                .courses(courseRepository.count())
                .signs(signRepository.count())
                .completedCourses(courseProgressRepository.countByCompletedTrue())
                .awardedBadges(userBadgeRepository.count())
                .issuedCertificates(issuedCertificateRepository.count())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDTO> users() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(UserMapper::toResponseDTO)
                .toList();
    }

    @Override
    public UserResponseDTO updateRole(Long userId, Role role, String administratorEmail) {
        User user = requiredUser(userId);
        Role previousRole = user.getRole();
        if (user.getEmail().equalsIgnoreCase(administratorEmail) && role != Role.ADMIN) {
            throw new IllegalArgumentException("Vous ne pouvez pas retirer votre propre rôle administrateur.");
        }
        if (user.getRole() == Role.ADMIN && role != Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new IllegalArgumentException("Le dernier administrateur ne peut pas être rétrogradé.");
        }
        user.setRole(role);
        User savedUser = userRepository.save(user);
        log.info("ADMIN_AUDIT action=role_change actor={} targetUserId={} previousRole={} newRole={}",
                administratorEmail, userId, previousRole, role);
        return UserMapper.toResponseDTO(savedUser);
    }

    @Override
    public UserResponseDTO updateStatus(Long userId, boolean active, String administratorEmail) {
        User user = requiredUser(userId);
        boolean previousStatus = user.isActive();
        if (user.getEmail().equalsIgnoreCase(administratorEmail) && !active) {
            throw new IllegalArgumentException("Vous ne pouvez pas désactiver votre propre compte.");
        }
        if (user.getRole() == Role.ADMIN && !active && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new IllegalArgumentException("Le dernier administrateur ne peut pas être désactivé.");
        }
        user.setActive(active);
        User savedUser = userRepository.save(user);
        log.info("ADMIN_AUDIT action=status_change actor={} targetUserId={} previousActive={} newActive={}",
                administratorEmail, userId, previousStatus, active);
        return UserMapper.toResponseDTO(savedUser);
    }

    private User requiredUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
    }
}
