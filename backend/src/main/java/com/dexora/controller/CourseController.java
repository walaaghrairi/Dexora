package com.dexora.controller;

import com.dexora.dto.CourseDTO;
import com.dexora.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {
    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseDTO>> findAll() { return ResponseEntity.ok(courseService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(courseService.findById(id)); }

    @PostMapping
    public ResponseEntity<CourseDTO> create(@RequestBody CourseDTO dto) { return ResponseEntity.ok(courseService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> update(@PathVariable Long id, @RequestBody CourseDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(courseService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
