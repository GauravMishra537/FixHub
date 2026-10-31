package com.fixhub.ticket.service;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.WorkflowAction;

/**
 * A ticket type that keeps its own rows (infra booking keeps sessions) implements this.
 * The workflow calls it inside the same transaction, right after the ticket status changed.
 * Throw a ResponseStatusException to refuse. The whole move is then rolled back.
 * This way the ticket package never imports a type package.
 */
public interface TicketLifecycleHook {

    /** Which ticket type this hook is for. */
    TicketType type();

    void onTransition(Ticket ticket, WorkflowAction action, TicketStatus from, TicketStatus to,
                      Long actorId, String note);
}