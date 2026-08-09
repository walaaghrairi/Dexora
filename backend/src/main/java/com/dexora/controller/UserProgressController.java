package com.dexora.controller;

import com.dexora.dto.UserProgressDTO;
import com.dexora.service.UserProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-progress")
@RequiredArgsConstructor
public class UserProgressController {
    private final UserProgressService userProgressService;

    @GetMapping
    public ResponseEntity<List<UserProgressDTO>> findAll() { return ResponseEntity.ok(userProgressService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserProgressDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(userProgressService.findById(id)); }

    @PostMapping
    public ResponseEntity<UserProgressDTO> create(@RequestBody UserProgressDTO dto) { return ResponseEntity.ok(userProgressService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserProgressDTO> update(@PathVariable Long id, @RequestBody UserProgressDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(userProgressService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userProgressService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
