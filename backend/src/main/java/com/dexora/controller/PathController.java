package com.dexora.controller;

import com.dexora.dto.PathDTO;
import com.dexora.service.PathService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/paths")
@RequiredArgsConstructor
public class PathController {
    private final PathService pathService;

    @GetMapping
    public ResponseEntity<List<PathDTO>> findAll() { return ResponseEntity.ok(pathService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<PathDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(pathService.findById(id)); }

    @PostMapping
    public ResponseEntity<PathDTO> create(@RequestBody PathDTO dto) { return ResponseEntity.ok(pathService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<PathDTO> update(@PathVariable Long id, @RequestBody PathDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(pathService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pathService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
