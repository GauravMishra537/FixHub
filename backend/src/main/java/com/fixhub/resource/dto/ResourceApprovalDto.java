package com.fixhub.resource.dto;

import com.fixhub.ticket.entity.TicketPriority;

import java.time.Instant;
import java.time.LocalDate;

/** One request waiting for me. version is the ticket version, needed to approve or reject it. */
public record ResourceApprovalDto(
        Long ticketId,
        String ticketNo,
        String title,
        TicketPriority priority,
        Long version,
        String requesterName,
        String itemName,
        int quantity,
        String reason,
        LocalDate neededBy,
        Instant createdOn) {
}