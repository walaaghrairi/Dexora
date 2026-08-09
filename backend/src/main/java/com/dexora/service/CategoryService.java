package com.dexora.service;

import com.dexora.dto.CategoryDTO;
import java.util.List;

public interface CategoryService {
    CategoryDTO create(CategoryDTO categoryDTO);
    CategoryDTO update(CategoryDTO categoryDTO);
    CategoryDTO findById(Long id);
    List<CategoryDTO> findAll();
    void delete(Long id);
}
