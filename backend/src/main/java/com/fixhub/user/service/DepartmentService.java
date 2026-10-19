package com.fixhub.user.service;

import com.fixhub.user.dto.DepartmentRequestDto;
import com.fixhub.user.dto.DepartmentResponseDto;

import java.util.List;

public interface DepartmentService {

    List<DepartmentResponseDto> getAll();

    DepartmentResponseDto create(DepartmentRequestDto request);

    DepartmentResponseDto update(Long id, DepartmentRequestDto request);

    void delete(Long id);
}