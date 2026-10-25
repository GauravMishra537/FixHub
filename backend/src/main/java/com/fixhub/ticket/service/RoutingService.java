package com.fixhub.ticket.service;

import com.fixhub.ticket.entity.TicketType;

import java.util.Optional;

public interface RoutingService {

    /**
     * Department id for a new ticket. Lookup order: type + category, then type only.
     * Empty = no rule, the ticket stays unrouted.
     */
    Optional<Long> resolveDepartmentId(TicketType type, Long categoryId);
}