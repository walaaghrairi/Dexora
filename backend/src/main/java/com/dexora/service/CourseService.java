package com.dexora.service;

import com.dexora.dto.CourseDTO;
import java.util.List;

public interface CourseService {
    CourseDTO create(CourseDTO courseDTO);
    CourseDTO update(CourseDTO courseDTO);
    CourseDTO findById(Long id);
    List<CourseDTO> findAll();
    void delete(Long id);
}
