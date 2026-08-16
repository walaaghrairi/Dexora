package com.dexora.controller;

import com.dexora.dto.CertificateIssueRequest;
import com.dexora.dto.CertificateVerificationDTO;
import com.dexora.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/course/{courseId}/issue")
    public ResponseEntity<CertificateVerificationDTO> issue(
            @PathVariable Long courseId,
            @Valid @RequestBody CertificateIssueRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(certificateService.issue(authentication.getName(), courseId, request.getEarnedBadges()));
    }

    @GetMapping("/verify/{verificationCode}")
    public ResponseEntity<CertificateVerificationDTO> verify(@PathVariable String verificationCode) {
        return ResponseEntity.ok(certificateService.verify(verificationCode));
    }
}
