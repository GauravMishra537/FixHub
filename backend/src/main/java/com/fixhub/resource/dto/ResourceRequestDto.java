package com.fixhub.resource.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

import java.time.LocalDate;

/** The request form. priority and visibility are optional: Medium and Private when empty. */
public record ResourceRequestDto(
        Long itemId,
        Integer quantity,
        String reason,
        LocalDate neededBy,
        TicketPriority priority,
        TicketVisibility visibility) {
}