package com.dexora.controller;

import com.dexora.dto.CourseProgressDTO;
import com.dexora.service.CourseProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/course-progress")
@RequiredArgsConstructor
public class CourseProgressController {
    private final CourseProgressService courseProgressService;

    @GetMapping
    public ResponseEntity<List<CourseProgressDTO>> findAll() { return ResponseEntity.ok(courseProgressService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<CourseProgressDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(courseProgressService.findById(id)); }

    @PostMapping
    public ResponseEntity<CourseProgressDTO> create(@RequestBody CourseProgressDTO dto) { return ResponseEntity.ok(courseProgressService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<CourseProgressDTO> update(@PathVariable Long id, @RequestBody CourseProgressDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(courseProgressService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseProgressService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
