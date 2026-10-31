package com.fixhub.infra.dto;

import java.util.List;

/** What create gives back: the new ticket and its sessions. */
public record BookingGroupDto(
        Long ticketId,
        String ticketNo,
        String title,
        List<BookingResponseDto> sessions) {
}