package com.dexora.service.impl;

import com.dexora.dto.UserDTO;
import com.dexora.dto.UserResponseDTO;
import com.dexora.entity.User;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.mapper.UserMapper;
import com.dexora.repository.UserRepository;
import com.dexora.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;


    @Override
    public UserResponseDTO create(UserDTO userDTO) {
        User user = UserMapper.toEntity(userDTO);
        return UserMapper.toResponseDTO(userRepository.save(user));
    }

    @Override
    public UserResponseDTO update(UserDTO userDTO) {
        if (!userRepository.existsById(userDTO.getId())) {
            throw new ResourceNotFoundException("User not found");
        }
        User user = UserMapper.toEntity(userDTO);
        return UserMapper.toResponseDTO(userRepository.save(user));
    }

    @Override
    public UserResponseDTO findById(Long id) {
        return userRepository.findById(id)
                .map(UserMapper::toResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public List<UserResponseDTO> findAll() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }
    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
