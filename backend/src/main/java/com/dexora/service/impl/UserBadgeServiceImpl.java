package com.dexora.service.impl;

import com.dexora.dto.UserBadgeDTO;
import com.dexora.entity.UserBadge;
import com.dexora.mapper.UserBadgeMapper;
import com.dexora.repository.UserBadgeRepository;
import com.dexora.service.UserBadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserBadgeServiceImpl implements UserBadgeService {

    private final UserBadgeRepository userBadgeRepository;

    @Override
    public UserBadgeDTO create(UserBadgeDTO userBadgeDTO) {
        UserBadge userBadge = UserBadgeMapper.toEntity(userBadgeDTO);
        return UserBadgeMapper.toDTO(userBadgeRepository.save(userBadge));
    }

    @Override
    public UserBadgeDTO update(UserBadgeDTO userBadgeDTO) {
        if (!userBadgeRepository.existsById(userBadgeDTO.getId())) {
            throw new RuntimeException("UserBadge not found");
        }
        UserBadge userBadge = UserBadgeMapper.toEntity(userBadgeDTO);
        return UserBadgeMapper.toDTO(userBadgeRepository.save(userBadge));
    }

    @Override
    public UserBadgeDTO findById(Long id) {
        return userBadgeRepository.findById(id)
                .map(UserBadgeMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("UserBadge not found"));
    }

    @Override
    public List<UserBadgeDTO> findAll() {
        return userBadgeRepository.findAll().stream()
                .map(UserBadgeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!userBadgeRepository.existsById(id)) {
            throw new RuntimeException("UserBadge not found");
        }
        userBadgeRepository.deleteById(id);
    }
}
