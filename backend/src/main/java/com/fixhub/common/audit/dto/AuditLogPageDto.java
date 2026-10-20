package com.fixhub.common.audit.dto;

import java.util.List;

public record AuditLogPageDto(
        List<AuditLogResponseDto> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}