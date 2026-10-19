package com.fixhub.user.mapper;

import com.fixhub.user.dto.DepartmentResponseDto;
import com.fixhub.user.entity.Department;
import org.springframework.stereotype.Component;

@Component
public class DepartmentMapper {

    public DepartmentResponseDto toDto(Department department) {
        if (department == null) {
            return null;
        }
        DepartmentResponseDto dto = new DepartmentResponseDto();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setActive(department.isActive());
        return dto;
    }
}