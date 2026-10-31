package com.fixhub.infra.dto;

import com.fixhub.infra.entity.BookingStatus;

import java.time.Instant;

/**
 * One booked slot on the board. Everyone sees title, team and time.
 * ticketId is filled only for the person who booked and for admins (the ticket is private).
 */
public record BoardSlotDto(
        Long bookingId,
        Long ticketId,
        String title,
        String teamName,
        Instant startTime,
        Instant endTime,
        boolean allDay,
        BookingStatus status,
        boolean mine) {
}