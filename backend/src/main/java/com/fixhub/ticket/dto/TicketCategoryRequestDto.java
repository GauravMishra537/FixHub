package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketCategoryRequestDto {

    @NotNull(message = "Ticket type is required")
    private TicketType ticketType;

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name cannot exceed 100 characters")
    private String name;

    private Boolean active;
}