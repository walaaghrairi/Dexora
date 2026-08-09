package com.dexora.service.impl;

import com.dexora.dto.SignDTO;
import com.dexora.entity.Sign;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.mapper.SignMapper;
import com.dexora.repository.SignRepository;
import com.dexora.service.SignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class SignServiceImpl implements SignService {

    private final SignRepository signRepository;

    @Override
    public SignDTO create(SignDTO signDTO) {
        Sign sign = SignMapper.toEntity(signDTO);
        return SignMapper.toDTO(signRepository.save(sign));
    }

    @Override
    public SignDTO update(SignDTO signDTO) {
        if (!signRepository.existsById(signDTO.getId())) {
            throw new ResourceNotFoundException("Sign not found");
        }
        Sign sign = SignMapper.toEntity(signDTO);
        return SignMapper.toDTO(signRepository.save(sign));
    }

    @Override
    public SignDTO findById(Long id) {
        return signRepository.findById(id)
                .map(SignMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Sign not found"));
    }

    @Override
    public List<SignDTO> findAll() {
        return signRepository.findAll().stream()
                .map(SignMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!signRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sign not found");
        }
        signRepository.deleteById(id);
    }
}
