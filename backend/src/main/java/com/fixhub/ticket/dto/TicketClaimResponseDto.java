package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.ClaimStatus;

import java.time.Instant;

public record TicketClaimResponseDto(
        Long id,
        Long ticketId,
        Long userId,
        String userName,
        ClaimStatus status,
        String rejectReason,
        Instant createdOn) {
}