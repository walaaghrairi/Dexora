package com.dexora.service;

import com.dexora.dto.UserDTO;
import java.util.List;

public interface UserService {
    UserDTO create(UserDTO userDTO);
    UserDTO update(UserDTO userDTO);
    UserDTO findById(Long id);
    List<UserDTO> findAll();
    void delete(Long id);
}
