package com.dexora.service;

import com.dexora.dto.AuthenticationResponse;
import com.dexora.dto.LoginRequest;
import com.dexora.dto.RegisterRequest;
import com.dexora.dto.TwoFactorLoginRequest;

public interface AuthenticationService {
    AuthenticationResponse register(RegisterRequest request);
    AuthenticationResponse login(LoginRequest request);
    AuthenticationResponse verifyTwoFactor(TwoFactorLoginRequest request);
}
