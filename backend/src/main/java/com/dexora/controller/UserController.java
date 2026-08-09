package com.dexora.controller;

import com.dexora.dto.UserDTO;
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
    public ResponseEntity<List<UserDTO>> findAll() { return ResponseEntity.ok(userService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> findById(@PathVariable Long id) { return ResponseEntity.ok(userService.findById(id)); }

    @PostMapping
    public ResponseEntity<UserDTO> create(@RequestBody UserDTO dto) { return ResponseEntity.ok(userService.create(dto)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> update(@PathVariable Long id, @RequestBody UserDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(userService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
