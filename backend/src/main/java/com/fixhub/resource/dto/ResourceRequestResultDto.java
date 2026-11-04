package com.fixhub.resource.dto;

import com.fixhub.ticket.entity.TicketStatus;

public record ResourceRequestResultDto(Long ticketId, String ticketNo, String title, TicketStatus status) {
}