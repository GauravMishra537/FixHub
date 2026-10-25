package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoutingRuleRequestDto {

    @NotNull(message = "Ticket type is required")
    private TicketType ticketType;

    // empty = the rule covers the whole type
    private Long categoryId;

    @NotNull(message = "Department is required")
    private Long departmentId;

    // empty = active
    private Boolean active;
}