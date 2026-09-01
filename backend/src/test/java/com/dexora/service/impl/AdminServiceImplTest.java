package com.dexora.service.impl;

import com.dexora.entity.User;
import com.dexora.enums.AuthProvider;
import com.dexora.enums.Role;
import com.dexora.repository.CategoryRepository;
import com.dexora.repository.CourseProgressRepository;
import com.dexora.repository.CourseRepository;
import com.dexora.repository.IssuedCertificateRepository;
import com.dexora.repository.SignRepository;
import com.dexora.repository.UserBadgeRepository;
import com.dexora.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {
    @Mock private UserRepository userRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private SignRepository signRepository;
    @Mock private CourseProgressRepository courseProgressRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @Mock private IssuedCertificateRepository issuedCertificateRepository;

    private AdminServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminServiceImpl(
                userRepository,
                categoryRepository,
                courseRepository,
                signRepository,
                courseProgressRepository,
                userBadgeRepository,
                issuedCertificateRepository
        );
    }

    @Test
    void refusesToDemoteTheLastAdministrator() {
        User administrator = user(1L, "admin@tunisign.tn", Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(administrator));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        assertThrows(IllegalArgumentException.class,
                () -> service.updateRole(1L, Role.STUDENT, "another-admin@tunisign.tn"));
        verify(userRepository, never()).save(administrator);
    }

    @Test
    void refusesSelfDeactivation() {
        User administrator = user(1L, "admin@tunisign.tn", Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(administrator));

        assertThrows(IllegalArgumentException.class,
                () -> service.updateStatus(1L, false, "ADMIN@TUNISIGN.TN"));
        verify(userRepository, never()).save(administrator);
    }

    @Test
    void allowsAnAdministratorToDeactivateAStudent() {
        User student = user(9L, "student@tunisign.tn", Role.STUDENT);
        when(userRepository.findById(9L)).thenReturn(Optional.of(student));
        when(userRepository.save(student)).thenReturn(student);

        var response = service.updateStatus(9L, false, "admin@tunisign.tn");

        assertEquals(false, response.isActive());
        verify(userRepository).save(student);
    }

    private User user(Long id, String email, Role role) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(email);
        user.setHashPassword("hash");
        user.setRole(role);
        user.setActive(true);
        user.setEmailVerified(true);
        user.setAuthProvider(AuthProvider.LOCAL);
        return user;
    }
}
