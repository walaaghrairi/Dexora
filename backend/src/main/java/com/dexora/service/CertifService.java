package com.dexora.service;

import com.dexora.dto.CertifDTO;
import java.util.List;

public interface CertifService {
    CertifDTO create(CertifDTO certifDTO);
    CertifDTO update(CertifDTO certifDTO);
    CertifDTO findById(Long id);
    List<CertifDTO> findAll();
    void delete(Long id);
}
