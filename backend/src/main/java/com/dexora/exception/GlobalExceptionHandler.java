package com.dexora.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleResourceNotFoundException(ResourceNotFoundException exception) {
        return response(HttpStatus.NOT_FOUND, "Ressource introuvable", exception.getMessage());
    }

    @ExceptionHandler(CertificateEligibilityException.class)
    public ResponseEntity<ProblemDetail> handleCertificateEligibilityException(CertificateEligibilityException exception) {
        return response(HttpStatus.CONFLICT, "Certificat non disponible", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationExceptions(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError fieldError ? fieldError.getField() : "request";
            errors.put(fieldName, error.getDefaultMessage());
        });
        ProblemDetail detail = problem(HttpStatus.BAD_REQUEST, "Requête invalide", "Certains champs sont invalides.");
        detail.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadableMessage() {
        return response(HttpStatus.BAD_REQUEST, "Requête invalide", "Le contenu JSON est absent ou mal formé.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleBadCredentials(
            BadCredentialsException exception,
            HttpServletRequest request
    ) {
        log.warn("Échec d'authentification depuis {} sur {}", request.getRemoteAddr(), request.getRequestURI());
        return response(HttpStatus.UNAUTHORIZED, "Authentification refusée", "Identifiants ou code de sécurité invalides.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException exception) {
        return response(HttpStatus.BAD_REQUEST, "Opération invalide", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException exception) {
        log.error("Service temporairement indisponible", exception);
        return response(HttpStatus.SERVICE_UNAVAILABLE, "Service indisponible", "Le service est temporairement indisponible.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleException(Exception exception) {
        String errorId = UUID.randomUUID().toString();
        log.error("Erreur interne {}", errorId, exception);
        ProblemDetail detail = problem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erreur interne",
                "Une erreur interne est survenue. Référence : " + errorId
        );
        detail.setProperty("errorId", errorId);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(detail);
    }

    private ResponseEntity<ProblemDetail> response(HttpStatus status, String title, String message) {
        return ResponseEntity.status(status).body(problem(status, title, message));
    }

    private ProblemDetail problem(HttpStatus status, String title, String message) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(status, message);
        detail.setTitle(title);
        detail.setType(URI.create("about:blank"));
        return detail;
    }
}
