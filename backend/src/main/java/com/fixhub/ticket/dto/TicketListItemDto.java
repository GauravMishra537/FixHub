package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** One row of a ticket table: light, no description. */
@Getter
@Setter
public class TicketListItemDto {

    private Long id;
    private String ticketNo;
    private TicketType type;
    private String title;
    private TicketStatus status;
    private TicketPriority priority;

    private Long requesterId;
    private String requesterName;
    private String assigneeName;
    private String categoryName;

    private Instant createdOn;
}