package com.dexora.service.impl;

import com.dexora.dto.CourseDTO;
import com.dexora.entity.Course;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.mapper.CourseMapper;
import com.dexora.repository.CourseRepository;
import com.dexora.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    @Override
    public CourseDTO create(CourseDTO courseDTO) {
        Course course = CourseMapper.toEntity(courseDTO);
        if (course.getCreatedAt() == null) {
            course.setCreatedAt(LocalDateTime.now());
        }
        return CourseMapper.toDTO(courseRepository.save(course));
    }

    @Override
    public CourseDTO update(CourseDTO courseDTO) {
        if (!courseRepository.existsById(courseDTO.getId())) {
            throw new ResourceNotFoundException("Course not found");
        }
        Course course = CourseMapper.toEntity(courseDTO);
        return CourseMapper.toDTO(courseRepository.save(course));
    }

    @Override
    public CourseDTO findById(Long id) {
        return courseRepository.findById(id)
                .map(CourseMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    @Override
    public List<CourseDTO> findAll() {
        return courseRepository.findAll().stream()
                .map(CourseMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course not found");
        }
        courseRepository.deleteById(id);
    }
}
