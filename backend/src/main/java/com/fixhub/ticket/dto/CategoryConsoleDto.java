package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketType;

public record CategoryConsoleDto(
        Long id,
        TicketType ticketType,
        String name,
        boolean active,
        long ticketCount) {
}