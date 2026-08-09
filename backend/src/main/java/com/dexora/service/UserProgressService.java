package com.dexora.service;

import com.dexora.dto.UserProgressDTO;
import java.util.List;

public interface UserProgressService {
    UserProgressDTO create(UserProgressDTO userProgressDTO);
    UserProgressDTO update(UserProgressDTO userProgressDTO);
    UserProgressDTO findById(Long id);
    List<UserProgressDTO> findAll();
    void delete(Long id);
}
