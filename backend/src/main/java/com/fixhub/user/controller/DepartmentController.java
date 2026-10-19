package com.fixhub.user.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.user.dto.DepartmentRequestDto;
import com.fixhub.user.dto.DepartmentResponseDto;
import com.fixhub.user.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/departments")
@PreAuthorize("hasRole('ADMIN')")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentResponseDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentResponseDto>> create(@Valid @RequestBody DepartmentRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created", departmentService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponseDto>> update(@PathVariable Long id,
                                                                     @Valid @RequestBody DepartmentRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Department updated", departmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted", null));
    }
}