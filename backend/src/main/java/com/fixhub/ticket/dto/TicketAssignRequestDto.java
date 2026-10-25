package com.fixhub.ticket.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketAssignRequestDto {

    @NotNull(message = "User is required")
    private Long userId;
}