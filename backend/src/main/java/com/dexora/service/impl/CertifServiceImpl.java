package com.dexora.service.impl;

import com.dexora.dto.CertifDTO;
import com.dexora.entity.Certif;
import com.dexora.mapper.CertifMapper;
import com.dexora.repository.CertifRepository;
import com.dexora.service.CertifService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CertifServiceImpl implements CertifService {

    private final CertifRepository certifRepository;

    @Override
    public CertifDTO create(CertifDTO certifDTO) {
        Certif certif = CertifMapper.toEntity(certifDTO);
        return CertifMapper.toDTO(certifRepository.save(certif));
    }

    @Override
    public CertifDTO update(CertifDTO certifDTO) {
        if (!certifRepository.existsById(certifDTO.getId())) {
            throw new RuntimeException("Certif not found");
        }
        Certif certif = CertifMapper.toEntity(certifDTO);
        return CertifMapper.toDTO(certifRepository.save(certif));
    }

    @Override
    public CertifDTO findById(Long id) {
        return certifRepository.findById(id)
                .map(CertifMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Certif not found"));
    }

    @Override
    public List<CertifDTO> findAll() {
        return certifRepository.findAll().stream()
                .map(CertifMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!certifRepository.existsById(id)) {
            throw new RuntimeException("Certif not found");
        }
        certifRepository.deleteById(id);
    }
}
