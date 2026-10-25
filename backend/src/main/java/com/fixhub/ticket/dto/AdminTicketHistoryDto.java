package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.HistoryAction;

import java.time.Instant;

/** One row of the admin Ticket history page. */
public record AdminTicketHistoryDto(
        Long id,
        Long ticketId,
        String ticketNo,
        HistoryAction action,
        String fieldName,
        String fromValue,
        String toValue,
        String note,
        String actorName,
        Instant createdOn) {
}