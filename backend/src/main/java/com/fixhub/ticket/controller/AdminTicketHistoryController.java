package com.fixhub.ticket.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.AdminTicketHistoryDto;
import com.fixhub.ticket.service.AdminTicketHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ticket-history")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketHistoryController {

    private final AdminTicketHistoryService service;

    public AdminTicketHistoryController(AdminTicketHistoryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminTicketHistoryDto>>> list(
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.list(action, page, size)));
    }

    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<String>>> actions() {
        return ResponseEntity.ok(ApiResponse.success(service.actions()));
    }
}