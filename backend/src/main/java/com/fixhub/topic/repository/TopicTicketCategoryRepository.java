package com.fixhub.topic.repository;

import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import org.springframework.data.repository.Repository;

import java.util.Optional;

/** Read only. Finds the card chip (a ticket category) by its name. */
public interface TopicTicketCategoryRepository extends Repository<TicketCategory, Long> {

    Optional<TicketCategory> findFirstByTicketTypeAndNameIgnoreCase(TicketType ticketType, String name);
}