package com.fixhub.infra.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

import java.util.List;

/** The whole form. One kind, one headcount, one or more sessions. Priority and visibility are optional. */
public record BookingRequestDto(
        Long infraTypeId,
        String title,
        String note,
        Integer headcount,
        TicketPriority priority,
        TicketVisibility visibility,
        List<SessionRequestDto> sessions) {
}