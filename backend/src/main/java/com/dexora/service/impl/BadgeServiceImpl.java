package com.dexora.service.impl;

import com.dexora.dto.BadgeDTO;
import com.dexora.entity.Badge;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.mapper.BadgeMapper;
import com.dexora.repository.BadgeRepository;
import com.dexora.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class BadgeServiceImpl implements BadgeService {

    private final BadgeRepository badgeRepository;

    @Override
    public BadgeDTO create(BadgeDTO badgeDTO) {
        Badge badge = BadgeMapper.toEntity(badgeDTO);
        return BadgeMapper.toDTO(badgeRepository.save(badge));
    }

    @Override
    public BadgeDTO update(BadgeDTO badgeDTO) {
        if (!badgeRepository.existsById(badgeDTO.getId())) {
            throw new ResourceNotFoundException("Badge not found");
        }
        Badge badge = BadgeMapper.toEntity(badgeDTO);
        return BadgeMapper.toDTO(badgeRepository.save(badge));
    }

    @Override
    public BadgeDTO findById(Long id) {
        return badgeRepository.findById(id)
                .map(BadgeMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Badge not found"));
    }

    @Override
    public List<BadgeDTO> findAll() {
        return badgeRepository.findAll().stream()
                .map(BadgeMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!badgeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Badge not found");
        }
        badgeRepository.deleteById(id);
    }
}
