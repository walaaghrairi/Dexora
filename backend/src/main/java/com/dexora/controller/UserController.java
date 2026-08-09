package com.dexora.controller;

import com.dexora.dto.UserDTO;
import com.dexora.dto.UserResponseDTO;
import com.dexora.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> findAll() { return ResponseEntity.ok(userService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(userService.findById(id)); }

    @PostMapping
    public ResponseEntity<UserResponseDTO> create(@RequestBody UserDTO dto) { return ResponseEntity.ok(userService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> update(@PathVariable Long id, @RequestBody UserDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(userService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
