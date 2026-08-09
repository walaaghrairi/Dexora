package com.dexora.service.impl;

import com.dexora.dto.CategoryDTO;
import com.dexora.entity.Category;
import com.dexora.exception.ResourceNotFoundException;
import com.dexora.mapper.CategoryMapper;
import com.dexora.repository.CategoryRepository;
import com.dexora.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public CategoryDTO create(CategoryDTO categoryDTO) {
        Category category = CategoryMapper.toEntity(categoryDTO);
        return CategoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public CategoryDTO update(CategoryDTO categoryDTO) {
        if (!categoryRepository.existsById(categoryDTO.getId())) {
            throw new ResourceNotFoundException("Category not found");
        }
        Category category = CategoryMapper.toEntity(categoryDTO);
        return CategoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public CategoryDTO findById(Long id) {
        return categoryRepository.findById(id)
                .map(CategoryMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    @Override
    public List<CategoryDTO> findAll() {
        return categoryRepository.findAll().stream()
                .map(CategoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found");
        }
        categoryRepository.deleteById(id);
    }
}
