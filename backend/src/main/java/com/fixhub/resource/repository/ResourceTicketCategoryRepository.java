package com.fixhub.resource.repository;

import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import org.springframework.data.repository.Repository;

import java.util.Optional;

/** Read only look at ticket categories, to find the chip a request card shows. */
public interface ResourceTicketCategoryRepository extends Repository<TicketCategory, Long> {

    Optional<TicketCategory> findFirstByTicketTypeAndNameIgnoreCase(TicketType ticketType, String name);
}