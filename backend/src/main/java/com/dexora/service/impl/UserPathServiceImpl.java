package com.dexora.service.impl;

import com.dexora.dto.UserPathDTO;
import com.dexora.entity.UserPath;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.mapper.UserPathMapper;
import com.dexora.repository.UserPathRepository;
import com.dexora.service.UserPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserPathServiceImpl implements UserPathService {

    private final UserPathRepository userPathRepository;

    @Override
    public UserPathDTO create(UserPathDTO userPathDTO) {
        UserPath userPath = UserPathMapper.toEntity(userPathDTO);
        return UserPathMapper.toDTO(userPathRepository.save(userPath));
    }

    @Override
    public UserPathDTO update(UserPathDTO userPathDTO) {
        if (!userPathRepository.existsById(userPathDTO.getId())) {
            throw new ResourceNotFoundException("UserPath not found");
        }
        UserPath userPath = UserPathMapper.toEntity(userPathDTO);
        return UserPathMapper.toDTO(userPathRepository.save(userPath));
    }

    @Override
    public UserPathDTO findById(Long id) {
        return userPathRepository.findById(id)
                .map(UserPathMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("UserPath not found"));
    }

    @Override
    public List<UserPathDTO> findAll() {
        return userPathRepository.findAll().stream()
                .map(UserPathMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!userPathRepository.existsById(id)) {
            throw new ResourceNotFoundException("UserPath not found");
        }
        userPathRepository.deleteById(id);
    }
}
