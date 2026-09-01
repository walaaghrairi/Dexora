package com.dexora.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void unexpectedErrorsDoNotLeakInternalMessages() {
        ResponseEntity<ProblemDetail> response = handler.handleException(
                new RuntimeException("jdbc:postgresql://private-host secret=password123")
        );

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().getDetail().contains("private-host"));
        assertFalse(response.getBody().getDetail().contains("password123"));
        assertNotNull(response.getBody().getProperties().get("errorId"));
    }
}
