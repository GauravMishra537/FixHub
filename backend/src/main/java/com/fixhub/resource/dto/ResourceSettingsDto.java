package com.fixhub.resource.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

public record ResourceSettingsDto(
        TicketPriority priority,
        TicketVisibility visibility,
        Long version) {
}