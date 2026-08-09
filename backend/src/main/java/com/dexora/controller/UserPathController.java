package com.dexora.controller;

import com.dexora.dto.UserPathDTO;
import com.dexora.service.UserPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-paths")
@RequiredArgsConstructor
public class UserPathController {
    private final UserPathService userPathService;

    @GetMapping
    public ResponseEntity<List<UserPathDTO>> findAll() { return ResponseEntity.ok(userPathService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserPathDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(userPathService.findById(id)); }

    @PostMapping
    public ResponseEntity<UserPathDTO> create(@RequestBody UserPathDTO dto) { return ResponseEntity.ok(userPathService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserPathDTO> update(@PathVariable Long id, @RequestBody UserPathDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(userPathService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userPathService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
