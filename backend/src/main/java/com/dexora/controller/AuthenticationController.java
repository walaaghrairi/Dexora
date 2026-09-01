package com.dexora.controller;

import com.dexora.dto.AuthenticationResponse;
import com.dexora.dto.EmailVerificationRequest;
import com.dexora.dto.EmailVerificationResponse;
import com.dexora.dto.GoogleAuthRequest;
import com.dexora.dto.LoginRequest;
import com.dexora.dto.RegisterRequest;
import com.dexora.dto.TwoFactorLoginRequest;
import com.dexora.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthenticationResponse> verifyTwoFactor(@Valid @RequestBody TwoFactorLoginRequest request) {
        return ResponseEntity.ok(authenticationService.verifyTwoFactor(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthenticationResponse> google(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authenticationService.google(request));
    }

    @GetMapping("/email/verify")
    public ResponseEntity<EmailVerificationResponse> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authenticationService.verifyEmail(token));
    }

    @PostMapping("/email/resend")
    public ResponseEntity<EmailVerificationResponse> resendVerification(
            @Valid @RequestBody EmailVerificationRequest request) {
        return ResponseEntity.ok(authenticationService.resendVerification(request.getEmail()));
    }
}
