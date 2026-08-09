package com.dexora.controller;

import com.dexora.dto.UserBadgeDTO;
import com.dexora.service.UserBadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-badges")
@RequiredArgsConstructor
public class UserBadgeController {
    private final UserBadgeService userBadgeService;

    @GetMapping
    public ResponseEntity<List<UserBadgeDTO>> findAll() { return ResponseEntity.ok(userBadgeService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserBadgeDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(userBadgeService.findById(id)); }

    @PostMapping
    public ResponseEntity<UserBadgeDTO> create(@RequestBody UserBadgeDTO dto) { return ResponseEntity.ok(userBadgeService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserBadgeDTO> update(@PathVariable Long id, @RequestBody UserBadgeDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(userBadgeService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userBadgeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
