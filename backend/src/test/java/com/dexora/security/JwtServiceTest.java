package com.dexora.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.Encoders;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    @Test
    void signsAndValidatesAToken() {
        JwtService service = new JwtService(secret(), 60_000, true);
        UserDetails user = User.withUsername("amine@example.com").password("ignored").roles("STUDENT").build();

        String token = service.generateToken(user);

        assertEquals("amine@example.com", service.extractUsername(token));
        assertTrue(service.isTokenValid(token, user));
    }

    @Test
    void rejectsATamperedToken() {
        JwtService service = new JwtService(secret(), 60_000, true);
        UserDetails user = User.withUsername("amine@example.com").password("ignored").roles("STUDENT").build();
        String token = service.generateToken(user);
        String tampered = token.substring(0, token.length() - 1) + (token.endsWith("A") ? "B" : "A");

        assertThrows(JwtException.class, () -> service.extractUsername(tampered));
    }

    @Test
    void productionModeRequiresAnExplicitSecret() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", 60_000, true));
    }

    private String secret() {
        byte[] value = new byte[64];
        new SecureRandom().nextBytes(value);
        return Encoders.BASE64.encode(value);
    }
}
