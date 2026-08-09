package com.dexora.service.impl;

import com.dexora.dto.CourseProgressDTO;
import com.dexora.entity.CourseProgress;
import com.dexora.mapper.CourseProgressMapper;
import com.dexora.repository.CourseProgressRepository;
import com.dexora.service.CourseProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CourseProgressServiceImpl implements CourseProgressService {

    private final CourseProgressRepository courseProgressRepository;

    @Override
    public CourseProgressDTO create(CourseProgressDTO courseProgressDTO) {
        CourseProgress courseProgress = CourseProgressMapper.toEntity(courseProgressDTO);
        return CourseProgressMapper.toDTO(courseProgressRepository.save(courseProgress));
    }

    @Override
    public CourseProgressDTO update(CourseProgressDTO courseProgressDTO) {
        if (!courseProgressRepository.existsById(courseProgressDTO.getId())) {
            throw new RuntimeException("CourseProgress not found");
        }
        CourseProgress courseProgress = CourseProgressMapper.toEntity(courseProgressDTO);
        return CourseProgressMapper.toDTO(courseProgressRepository.save(courseProgress));
    }

    @Override
    public CourseProgressDTO findById(Long id) {
        return courseProgressRepository.findById(id)
                .map(CourseProgressMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("CourseProgress not found"));
    }

    @Override
    public List<CourseProgressDTO> findAll() {
        return courseProgressRepository.findAll().stream()
                .map(CourseProgressMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!courseProgressRepository.existsById(id)) {
            throw new RuntimeException("CourseProgress not found");
        }
        courseProgressRepository.deleteById(id);
    }
}
