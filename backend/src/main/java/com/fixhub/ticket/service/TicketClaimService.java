package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.ClaimStateDto;
import com.fixhub.ticket.dto.TicketClaimResponseDto;
import com.fixhub.ticket.dto.TicketResponseDto;

import java.util.List;

public interface TicketClaimService {

    // ---------- employee ----------

    /** An employee of the routed department takes the ticket, or asks to take it. */
    TicketResponseDto claim(Long ticketId, TicketActor actor);

    /** The employee takes a waiting claim back. */
    TicketResponseDto withdraw(Long ticketId, TicketActor actor);

    // ---------- admin ----------

    /** All claims on a ticket, oldest first. */
    List<TicketClaimResponseDto> claims(Long ticketId, TicketActor actor);

    /** Admin picks one waiting claim. That person is assigned, the other waiting claims are rejected. */
    TicketResponseDto approveClaim(Long ticketId, Long claimId, TicketActor actor);

    TicketResponseDto rejectClaim(Long ticketId, Long claimId, String reason, TicketActor actor);

    /** Admin gives the ticket to a person, at any time, also when someone already has it. */
    TicketResponseDto assign(Long ticketId, Long userId, TicketActor actor);

    /** Admin takes the ticket back from the person while work has not started. */
    TicketResponseDto unassign(Long ticketId, TicketActor actor);

     /** Can this person claim the ticket, and do they have a live claim on it? */
    ClaimStateDto myState(Long ticketId, TicketActor actor);

}