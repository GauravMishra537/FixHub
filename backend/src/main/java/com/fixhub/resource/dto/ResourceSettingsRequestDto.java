package com.fixhub.resource.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

/** version = the ticket version the page was showing. A stale version gives 409. */
public record ResourceSettingsRequestDto(
        TicketPriority priority,
        TicketVisibility visibility,
        Long version) {
}