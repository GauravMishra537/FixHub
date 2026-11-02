package com.fixhub.infra.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

/** version = the ticket version the page was showing. Stale version gives 409. */
public record InfraSettingsRequestDto(
        TicketPriority priority,
        TicketVisibility visibility,
        Long version) {
}