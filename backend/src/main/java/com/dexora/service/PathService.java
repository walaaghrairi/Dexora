package com.dexora.service;

import com.dexora.dto.PathDTO;
import java.util.List;

public interface PathService {
    PathDTO create(PathDTO pathDTO);
    PathDTO update(PathDTO pathDTO);
    PathDTO findById(Long id);
    List<PathDTO> findAll();
    void delete(Long id);
}
