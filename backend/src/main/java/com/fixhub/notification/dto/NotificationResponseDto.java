package com.fixhub.notification.dto;

import com.fixhub.notification.entity.NotificationType;

import java.time.Instant;

public record NotificationResponseDto(
        Long id,
        NotificationType type,
        Long ticketId,
        String message,
        boolean read,
        Instant createdOn) {
}