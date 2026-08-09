package com.dexora.controller;

import com.dexora.dto.SignDTO;
import com.dexora.service.SignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/signs")
@RequiredArgsConstructor
public class SignController {
    private final SignService signService;

    @GetMapping
    public ResponseEntity<List<SignDTO>> findAll() { return ResponseEntity.ok(signService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<SignDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(signService.findById(id)); }

    @PostMapping
    public ResponseEntity<SignDTO> create(@RequestBody SignDTO dto) { return ResponseEntity.ok(signService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<SignDTO> update(@PathVariable Long id, @RequestBody SignDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(signService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        signService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
