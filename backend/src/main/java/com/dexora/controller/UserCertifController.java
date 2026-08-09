package com.dexora.controller;

import com.dexora.dto.UserCertifDTO;
import com.dexora.service.UserCertifService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-certifs")
@RequiredArgsConstructor
public class UserCertifController {
    private final UserCertifService userCertifService;

    @GetMapping
    public ResponseEntity<List<UserCertifDTO>> findAll() { return ResponseEntity.ok(userCertifService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserCertifDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(userCertifService.findById(id)); }

    @PostMapping
    public ResponseEntity<UserCertifDTO> create(@RequestBody UserCertifDTO dto) { return ResponseEntity.ok(userCertifService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserCertifDTO> update(@PathVariable Long id, @RequestBody UserCertifDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(userCertifService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userCertifService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
