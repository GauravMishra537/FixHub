package com.fixhub.ticket.service;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.WorkflowAction;

/**
 * A ticket type that keeps its own rows (infra booking keeps sessions) implements this.
 * The workflow calls it inside the same transaction, before the ticket is saved.
 * Return the status the ticket must get, or null to keep the one the workflow chose (to).
 * Throw a ResponseStatusException to refuse. The whole move is then rolled back.
 * This way the ticket package never imports a type package.
 */
public interface TicketLifecycleHook {

    /** Which ticket type this hook is for. */
    TicketType type();

    TicketStatus onTransition(Ticket ticket, WorkflowAction action, TicketStatus from, TicketStatus to,
                              Long actorId, String note);
}