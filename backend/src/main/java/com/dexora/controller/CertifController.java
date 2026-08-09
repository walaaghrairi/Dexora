package com.dexora.controller;

import com.dexora.dto.CertifDTO;
import com.dexora.service.CertifService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/certifs")
@RequiredArgsConstructor
public class CertifController {
    private final CertifService certifService;

    @GetMapping
    public ResponseEntity<List<CertifDTO>> findAll() { return ResponseEntity.ok(certifService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<CertifDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(certifService.findById(id)); }

    @PostMapping
    public ResponseEntity<CertifDTO> create(@RequestBody CertifDTO dto) { return ResponseEntity.ok(certifService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<CertifDTO> update(@PathVariable Long id, @RequestBody CertifDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(certifService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        certifService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
