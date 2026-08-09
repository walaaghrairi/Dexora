package com.dexora.service;

import com.dexora.dto.CourseProgressDTO;
import java.util.List;

public interface CourseProgressService {
    CourseProgressDTO create(CourseProgressDTO courseProgressDTO);
    CourseProgressDTO update(CourseProgressDTO courseProgressDTO);
    CourseProgressDTO findById(Long id);
    List<CourseProgressDTO> findAll();
    void delete(Long id);
}
