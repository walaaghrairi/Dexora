package com.dexora.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class GoogleIdentityService {
    @Value("${application.security.google.client-id:}")
    private String clientId;

    public GoogleIdToken.Payload verify(String credential) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("Google Sign-In n'est pas encore configuré sur le backend.");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
            GoogleIdToken token = verifier.verify(credential);
            if (token == null || !Boolean.TRUE.equals(token.getPayload().getEmailVerified())) {
                throw new BadCredentialsException("Jeton Google invalide ou adresse Google non vérifiée.");
            }
            return token.getPayload();
        } catch (GeneralSecurityException | IOException exception) {
            throw new BadCredentialsException("Impossible de valider l'identité Google.", exception);
        }
    }
}
