package com.fixhub.ticket.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.TicketCategoryResponseDto;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.service.TicketCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Any logged in user: active categories for the create ticket form. */
@RestController
@RequestMapping("/api/ticket-categories")
public class TicketCategoryController {

    private final TicketCategoryService categoryService;

    public TicketCategoryController(TicketCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketCategoryResponseDto>>> getActive(@RequestParam String type) {
        TicketType parsed;
        try {
            parsed = TicketType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown ticket type: " + type);
        }
        return ResponseEntity.ok(ApiResponse.success(categoryService.getActiveByType(parsed)));
    }
}