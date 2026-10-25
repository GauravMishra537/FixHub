package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketType;

public record RoutingRuleResponseDto(
        Long id,
        TicketType ticketType,
        Long categoryId,
        String categoryName,
        Long departmentId,
        String departmentName,
        boolean active) {
}