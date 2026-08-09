package com.dexora.service.impl;

import com.dexora.dto.UserProgressDTO;
import com.dexora.entity.UserProgress;
import com.dexora.mapper.UserProgressMapper;
import com.dexora.repository.UserProgressRepository;
import com.dexora.service.UserProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserProgressServiceImpl implements UserProgressService {

    private final UserProgressRepository userProgressRepository;

    @Override
    public UserProgressDTO create(UserProgressDTO userProgressDTO) {
        UserProgress userProgress = UserProgressMapper.toEntity(userProgressDTO);
        return UserProgressMapper.toDTO(userProgressRepository.save(userProgress));
    }

    @Override
    public UserProgressDTO update(UserProgressDTO userProgressDTO) {
        if (!userProgressRepository.existsById(userProgressDTO.getId())) {
            throw new RuntimeException("UserProgress not found");
        }
        UserProgress userProgress = UserProgressMapper.toEntity(userProgressDTO);
        return UserProgressMapper.toDTO(userProgressRepository.save(userProgress));
    }

    @Override
    public UserProgressDTO findById(Long id) {
        return userProgressRepository.findById(id)
                .map(UserProgressMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("UserProgress not found"));
    }

    @Override
    public List<UserProgressDTO> findAll() {
        return userProgressRepository.findAll().stream()
                .map(UserProgressMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!userProgressRepository.existsById(id)) {
            throw new RuntimeException("UserProgress not found");
        }
        userProgressRepository.deleteById(id);
    }
}
