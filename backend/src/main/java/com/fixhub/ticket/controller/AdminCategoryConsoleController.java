package com.fixhub.ticket.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.CategoryActiveRequestDto;
import com.fixhub.ticket.dto.CategoryConsoleDto;
import com.fixhub.ticket.dto.CategoryMergeRequestDto;
import com.fixhub.ticket.dto.CategoryRenameRequestDto;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.service.CategoryConsoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin Issues console: rename, disable and merge categories. */
@RestController
@RequestMapping("/api/admin/category-console")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryConsoleController {

    private final CategoryConsoleService service;

    public AdminCategoryConsoleController(CategoryConsoleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryConsoleDto>>> list(
            @RequestParam(required = false) TicketType type) {
        return ResponseEntity.ok(ApiResponse.success(service.list(type)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryConsoleDto>> rename(
            @PathVariable Long id, @RequestBody CategoryRenameRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(service.rename(id, request.name())));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<CategoryConsoleDto>> setActive(
            @PathVariable Long id, @RequestBody CategoryActiveRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(service.setActive(id, request.active())));
    }

    @PostMapping("/{id}/merge")
    public ResponseEntity<ApiResponse<CategoryConsoleDto>> merge(
            @PathVariable Long id, @RequestBody CategoryMergeRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(service.merge(id, request.targetId())));
    }
}