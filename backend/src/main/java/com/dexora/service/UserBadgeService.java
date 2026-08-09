package com.dexora.service;

import com.dexora.dto.UserBadgeDTO;
import java.util.List;

public interface UserBadgeService {
    UserBadgeDTO create(UserBadgeDTO userBadgeDTO);
    UserBadgeDTO update(UserBadgeDTO userBadgeDTO);
    UserBadgeDTO findById(Long id);
    List<UserBadgeDTO> findAll();
    void delete(Long id);
}
