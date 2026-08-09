package com.dexora.service.impl;

import com.dexora.dto.AuthenticationResponse;
import com.dexora.dto.LoginRequest;
import com.dexora.dto.RegisterRequest;
import com.dexora.dto.UserDTO;
import com.dexora.dto.UserResponseDTO;
import com.dexora.enums.Role;
import com.dexora.security.JwtService;
import com.dexora.service.AuthenticationService;
import com.dexora.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Override
    public AuthenticationResponse register(RegisterRequest request) {
        if (userService.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        UserDTO userDTO = UserDTO.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .hashPassword(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .build();

        UserResponseDTO savedUser = userService.create(userDTO);
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String jwt = jwtService.generateToken(userDetails);

        return AuthenticationResponse.builder()
                .token(jwt)
                .build();
    }

    @Override
    public AuthenticationResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String jwt = jwtService.generateToken(userDetails);
        return AuthenticationResponse.builder().token(jwt).build();
    }
}
