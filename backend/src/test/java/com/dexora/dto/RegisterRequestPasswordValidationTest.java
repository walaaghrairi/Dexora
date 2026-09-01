package com.dexora.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterRequestPasswordValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsPasswordsMissingAnyRequiredCharacterType() {
        assertInvalidPassword("abcdefgh");
        assertInvalidPassword("ABCDEFG1!");
        assertInvalidPassword("Abcdefgh!");
        assertInvalidPassword("Abcdefg1");
        assertInvalidPassword("Abc 123!");
    }

    @Test
    void acceptsACompleteStrongPassword() {
        RegisterRequest request = validRequest("TuniSign1!");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    private void assertInvalidPassword(String password) {
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(validRequest(password));
        assertFalse(violations.isEmpty(), () -> "Le mot de passe aurait dû être refusé : " + password);
        assertTrue(violations.stream().anyMatch(violation -> "password".equals(violation.getPropertyPath().toString())));
    }

    private RegisterRequest validRequest(String password) {
        return RegisterRequest.builder()
                .firstName("Amine")
                .lastName("Trabelssi")
                .email("amine@example.com")
                .password(password)
                .build();
    }
}
