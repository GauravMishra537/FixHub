package com.fixhub.infra.repository;

import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import org.springframework.data.repository.Repository;

import java.util.Optional;

/** Read only lookup of the category chip (the kind name) for infra tickets. */
public interface InfraCategoryRepository extends Repository<TicketCategory, Long> {

    Optional<TicketCategory> findFirstByTicketTypeAndNameIgnoreCase(TicketType ticketType, String name);
}