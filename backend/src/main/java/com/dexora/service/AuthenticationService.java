package com.dexora.service;

import com.dexora.dto.AuthenticationResponse;
import com.dexora.dto.EmailVerificationResponse;
import com.dexora.dto.GoogleAuthRequest;
import com.dexora.dto.LoginRequest;
import com.dexora.dto.RegisterRequest;
import com.dexora.dto.TwoFactorLoginRequest;

public interface AuthenticationService {
    AuthenticationResponse register(RegisterRequest request);
    AuthenticationResponse login(LoginRequest request);
    AuthenticationResponse verifyTwoFactor(TwoFactorLoginRequest request);
    AuthenticationResponse google(GoogleAuthRequest request);
    EmailVerificationResponse verifyEmail(String token);
    EmailVerificationResponse resendVerification(String email);
}
