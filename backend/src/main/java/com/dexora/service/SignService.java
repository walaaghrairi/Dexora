package com.dexora.service;

import com.dexora.dto.SignDTO;
import java.util.List;

public interface SignService {
    SignDTO create(SignDTO signDTO);
    SignDTO update(SignDTO signDTO);
    SignDTO findById(Long id);
    List<SignDTO> findAll();
    void delete(Long id);
}
