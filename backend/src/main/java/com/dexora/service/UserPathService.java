package com.dexora.service;

import com.dexora.dto.UserPathDTO;
import java.util.List;

public interface UserPathService {
    UserPathDTO create(UserPathDTO userPathDTO);
    UserPathDTO update(UserPathDTO userPathDTO);
    UserPathDTO findById(Long id);
    List<UserPathDTO> findAll();
    void delete(Long id);
}
