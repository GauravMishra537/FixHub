package com.fixhub.ticket.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.ticket.dto.RoutingRuleRequestDto;
import com.fixhub.ticket.dto.RoutingRuleResponseDto;
import com.fixhub.ticket.service.RoutingRuleService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/admin/routing-rules")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoutingRuleController {

    private final RoutingRuleService service;

    public AdminRoutingRuleController(RoutingRuleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoutingRuleResponseDto>>> list() {
        return ResponseEntity.ok(ApiResponse.success(service.list()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoutingRuleResponseDto>> create(
            @Valid @RequestBody RoutingRuleRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Rule created", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoutingRuleResponseDto>> update(
            @PathVariable Long id, @Valid @RequestBody RoutingRuleRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Rule updated", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Rule deleted", null));
    }
}