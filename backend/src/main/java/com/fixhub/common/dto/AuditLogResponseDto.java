package com.fixhub.common.audit.dto;

import java.time.Instant;

public record AuditLogResponseDto(
        Long id,
        String eventType,
        Long userId,
        String userEmail,
        String description,
        String ipAddress,
        Instant createdAt) {
}