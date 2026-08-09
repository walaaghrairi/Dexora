package com.dexora.service;

import com.dexora.dto.UserCertifDTO;
import java.util.List;

public interface UserCertifService {
    UserCertifDTO create(UserCertifDTO userCertifDTO);
    UserCertifDTO update(UserCertifDTO userCertifDTO);
    UserCertifDTO findById(Long id);
    List<UserCertifDTO> findAll();
    void delete(Long id);
}
