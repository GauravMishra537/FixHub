package com.fixhub.common.audit.controller;

import com.fixhub.common.audit.dto.AuditLogPageDto;
import com.fixhub.common.audit.dto.AuditLogResponseDto;
import com.fixhub.common.audit.entity.AuditLog;
import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

    private final AuditService auditService;

    public AdminAuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<AuditLogPageDto>> search(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLog> result = auditService.search(eventType, userId, page, size);
        AuditLogPageDto dto = new AuditLogPageDto(
                result.getContent().stream().map(this::toDto).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    private AuditLogResponseDto toDto(AuditLog log) {
        return new AuditLogResponseDto(log.getId(), log.getEventType(), log.getUserId(), log.getUserEmail(),
                log.getDescription(), log.getIpAddress(), log.getCreatedAt());
    }
}