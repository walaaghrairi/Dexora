package com.dexora.controller;

import com.dexora.dto.PasswordChangeRequest;
import com.dexora.dto.ProfileUpdateRequest;
import com.dexora.dto.TwoFactorCodeRequest;
import com.dexora.dto.TwoFactorSetupResponse;
import com.dexora.dto.UserResponseDTO;
import com.dexora.entity.User;
import com.dexora.repository.UserRepository;
import com.dexora.security.TotpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;

    @GetMapping
    public ResponseEntity<UserResponseDTO> current(@AuthenticationPrincipal UserDetails principal) { return ResponseEntity.ok(response(user(principal))); }

    @PutMapping
    public ResponseEntity<UserResponseDTO> update(@AuthenticationPrincipal UserDetails principal, @RequestBody ProfileUpdateRequest request) {
        User user = user(principal);
        user.setFirstName(request.getFirstName()); user.setLastName(request.getLastName()); user.setEmail(request.getEmail());
        return ResponseEntity.ok(response(userRepository.save(user)));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> password(@AuthenticationPrincipal UserDetails principal, @RequestBody PasswordChangeRequest request) {
        User user = user(principal);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getHashPassword())) return ResponseEntity.badRequest().build();
        user.setHashPassword(passwordEncoder.encode(request.getNewPassword())); userRepository.save(user); return ResponseEntity.noContent().build();
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<TwoFactorSetupResponse> setup(@AuthenticationPrincipal UserDetails principal) {
        User user = user(principal); String secret = totpService.createSecret(); user.setTwoFactorSecret(secret); user.setTwoFactorEnabled(false); userRepository.save(user);
        return ResponseEntity.ok(TwoFactorSetupResponse.builder().secret(secret).otpAuthUri(totpService.otpAuthUri(user.getEmail(), secret)).build());
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<Void> enable(@AuthenticationPrincipal UserDetails principal, @RequestBody TwoFactorCodeRequest request) {
        User user = user(principal); if (!totpService.isValid(user.getTwoFactorSecret(), request.getCode())) return ResponseEntity.badRequest().build();
        user.setTwoFactorEnabled(true); userRepository.save(user); return ResponseEntity.noContent().build();
    }

    private User user(UserDetails principal) { return userRepository.findByEmail(principal.getUsername()).orElseThrow(); }
    private UserResponseDTO response(User user) { return UserResponseDTO.builder().id(user.getId()).firstName(user.getFirstName()).lastName(user.getLastName()).email(user.getEmail()).role(user.getRole()).createdAt(user.getCreatedAt()).twoFactorEnabled(user.isTwoFactorEnabled()).build(); }
}
