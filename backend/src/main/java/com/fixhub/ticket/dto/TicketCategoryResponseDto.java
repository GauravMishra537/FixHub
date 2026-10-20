package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketCategoryResponseDto {

    private Long id;
    private TicketType ticketType;
    private String name;
    private boolean active;
}