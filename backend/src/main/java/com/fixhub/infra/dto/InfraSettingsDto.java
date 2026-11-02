package com.fixhub.infra.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

public record InfraSettingsDto(
        TicketPriority priority,
        TicketVisibility visibility,
        Long version) {
}