package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.RoutingRule;
import com.fixhub.ticket.entity.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoutingRuleRepository extends JpaRepository<RoutingRule, Long> {

    // lookup for new tickets: active rules only
    Optional<RoutingRule> findByTicketTypeAndCategoryIdAndActiveTrue(TicketType ticketType, Long categoryId);

    Optional<RoutingRule> findByTicketTypeAndCategoryIdIsNullAndActiveTrue(TicketType ticketType);

    // duplicate check for the admin screen: active or not
    Optional<RoutingRule> findByTicketTypeAndCategoryId(TicketType ticketType, Long categoryId);

    Optional<RoutingRule> findByTicketTypeAndCategoryIdIsNull(TicketType ticketType);
}