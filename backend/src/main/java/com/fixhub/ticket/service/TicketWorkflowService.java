package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketTransitionRequestDto;

public interface TicketWorkflowService {

    /** Start, hold, resume, resolve, confirm, reopen or cancel. Returns the updated ticket. */
    TicketResponseDto transition(Long ticketId, TicketTransitionRequestDto request, TicketActor actor);
}