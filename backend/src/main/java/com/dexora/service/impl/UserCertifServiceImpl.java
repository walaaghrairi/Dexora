package com.dexora.service.impl;

import com.dexora.dto.UserCertifDTO;
import com.dexora.entity.UserCertif;
import com.dexora.mapper.UserCertifMapper;
import com.dexora.repository.UserCertifRepository;
import com.dexora.service.UserCertifService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserCertifServiceImpl implements UserCertifService {

    private final UserCertifRepository userCertifRepository;

    @Override
    public UserCertifDTO create(UserCertifDTO userCertifDTO) {
        UserCertif userCertif = UserCertifMapper.toEntity(userCertifDTO);
        return UserCertifMapper.toDTO(userCertifRepository.save(userCertif));
    }

    @Override
    public UserCertifDTO update(UserCertifDTO userCertifDTO) {
        if (!userCertifRepository.existsById(userCertifDTO.getId())) {
            throw new RuntimeException("UserCertif not found");
        }
        UserCertif userCertif = UserCertifMapper.toEntity(userCertifDTO);
        return UserCertifMapper.toDTO(userCertifRepository.save(userCertif));
    }

    @Override
    public UserCertifDTO findById(Long id) {
        return userCertifRepository.findById(id)
                .map(UserCertifMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("UserCertif not found"));
    }

    @Override
    public List<UserCertifDTO> findAll() {
        return userCertifRepository.findAll().stream()
                .map(UserCertifMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!userCertifRepository.existsById(id)) {
            throw new RuntimeException("UserCertif not found");
        }
        userCertifRepository.deleteById(id);
    }
}
