package com.dexora.service;

import com.dexora.dto.UserDTO;
import com.dexora.dto.UserResponseDTO;
import java.util.List;

public interface UserService {
    UserResponseDTO create(UserDTO userDTO);
    UserResponseDTO update(UserDTO userDTO);
    UserResponseDTO findById(Long id);
    List<UserResponseDTO> findAll();
    void delete(Long id);
    boolean existsByEmail(String email);
}
