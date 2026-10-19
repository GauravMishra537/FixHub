package com.fixhub.user.service.impl;

import com.fixhub.common.audit.service.AuditRecorder;
import com.fixhub.user.dto.DepartmentRequestDto;
import com.fixhub.user.dto.DepartmentResponseDto;
import com.fixhub.user.entity.Department;
import com.fixhub.user.mapper.DepartmentMapper;
import com.fixhub.user.repository.DepartmentRepository;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.service.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final DepartmentMapper departmentMapper;
    private final AuditRecorder auditRecorder;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository,
                                 UserRepository userRepository,
                                 DepartmentMapper departmentMapper,
                                 AuditRecorder auditRecorder) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.departmentMapper = departmentMapper;
        this.auditRecorder = auditRecorder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponseDto> getAll() {
        return departmentRepository.findAllByOrderByNameAsc().stream()
                .map(departmentMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public DepartmentResponseDto create(DepartmentRequestDto request) {
        String name = request.getName().trim();
        if (departmentRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department already exists");
        }
        Department department = new Department();
        department.setName(name);
        department.setActive(request.getActive() == null || request.getActive());
        Department saved = departmentRepository.save(department);
        auditRecorder.record("DEPARTMENT_CREATED", "Department created: " + saved.getName());
        return departmentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DepartmentResponseDto update(Long id, DepartmentRequestDto request) {
        Department department = findById(id);
        String name = request.getName().trim();
        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department already exists");
        }
        department.setName(name);
        if (request.getActive() != null) {
            department.setActive(request.getActive());
        }
        Department saved = departmentRepository.save(department);
        auditRecorder.record("DEPARTMENT_UPDATED",
                "Department updated: " + saved.getName() + " (active=" + saved.isActive() + ")");
        return departmentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Department department = findById(id);
        if (userRepository.existsByDepartmentId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Department has users. Move them to another department first");
        }
        departmentRepository.delete(department);
        auditRecorder.record("DEPARTMENT_DELETED", "Department deleted: " + department.getName());
    }

    private Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
    }
}