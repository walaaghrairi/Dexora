package com.dexora.service;

import com.dexora.dto.BadgeDTO;
import java.util.List;

public interface BadgeService {
    BadgeDTO create(BadgeDTO badgeDTO);
    BadgeDTO update(BadgeDTO badgeDTO);
    BadgeDTO findById(Long id);
    List<BadgeDTO> findAll();
    void delete(Long id);
}
