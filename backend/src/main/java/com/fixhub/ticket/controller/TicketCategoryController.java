package com.fixhub.ticket.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.TicketCategoryResponseDto;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.service.TicketCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Any logged in user. Active categories only. */
@RestController
@RequestMapping("/api/ticket-categories")
public class TicketCategoryController {

    private final TicketCategoryService categoryService;

    public TicketCategoryController(TicketCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // no q            -> all active categories of the type
    // q (even empty)  -> typing box suggestions, max 8, best match first
    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketCategoryResponseDto>>> list(
            @RequestParam TicketType type,
            @RequestParam(required = false) String q) {
        List<TicketCategoryResponseDto> result = q == null
                ? categoryService.getActiveByType(type)
                : categoryService.suggest(type, q);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}