package com.fixhub.ticket.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.TicketCategoryRequestDto;
import com.fixhub.ticket.dto.TicketCategoryResponseDto;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.service.TicketCategoryService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ticket-categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketCategoryController {

    private final TicketCategoryService categoryService;

    public AdminTicketCategoryController(TicketCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketCategoryResponseDto>>> getAll(
            @RequestParam(required = false) String type) {
        TicketType parsed = (type == null || type.isBlank()) ? null : parseType(type);
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAll(parsed)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TicketCategoryResponseDto>> create(
            @Valid @RequestBody TicketCategoryRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created", categoryService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketCategoryResponseDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody TicketCategoryRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", categoryService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }

    private TicketType parseType(String type) {
        try {
            return TicketType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown ticket type: " + type);
        }
    }
}