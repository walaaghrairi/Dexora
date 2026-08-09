package com.dexora.controller;

import com.dexora.dto.BadgeDTO;
import com.dexora.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/badges")
@RequiredArgsConstructor
public class BadgeController {
    private final BadgeService badgeService;

    @GetMapping
    public ResponseEntity<List<BadgeDTO>> findAll() { return ResponseEntity.ok(badgeService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<BadgeDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(badgeService.findById(id)); }

    @PostMapping
    public ResponseEntity<BadgeDTO> create(@RequestBody BadgeDTO dto) { return ResponseEntity.ok(badgeService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<BadgeDTO> update(@PathVariable Long id, @RequestBody BadgeDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(badgeService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        badgeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
