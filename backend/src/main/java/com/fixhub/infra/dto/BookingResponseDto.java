package com.fixhub.infra.dto;

import com.fixhub.infra.entity.BookingStatus;

import java.time.Instant;

public record BookingResponseDto(
        Long id,
        Long ticketId,
        String ticketNo,
        Long infrastructureId,
        String unitName,
        Long infraTypeId,
        String kindName,
        int capacity,
        String title,
        int headcount,
        Instant startTime,
        Instant endTime,
        boolean allDay,
        BookingStatus status,
        String reason,
        boolean oversize,
        Instant decidedOn,
        String decisionNote) {
}