package com.dexora.service.impl;

import com.dexora.dto.PathDTO;
import com.dexora.entity.Path;
import com.dexora.mapper.PathMapper;
import com.dexora.repository.PathRepository;
import com.dexora.service.PathService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PathServiceImpl implements PathService {

    private final PathRepository pathRepository;

    @Override
    public PathDTO create(PathDTO pathDTO) {
        Path path = PathMapper.toEntity(pathDTO);
        return PathMapper.toDTO(pathRepository.save(path));
    }

    @Override
    public PathDTO update(PathDTO pathDTO) {
        if (!pathRepository.existsById(pathDTO.getId())) {
            throw new RuntimeException("Path not found");
        }
        Path path = PathMapper.toEntity(pathDTO);
        return PathMapper.toDTO(pathRepository.save(path));
    }

    @Override
    public PathDTO findById(Long id) {
        return pathRepository.findById(id)
                .map(PathMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Path not found"));
    }

    @Override
    public List<PathDTO> findAll() {
        return pathRepository.findAll().stream()
                .map(PathMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!pathRepository.existsById(id)) {
            throw new RuntimeException("Path not found");
        }
        pathRepository.deleteById(id);
    }
}
