package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Long> {

    // admin list, all types
    List<TicketCategory> findAllByOrderByTicketTypeAscNameAsc();

    // admin list, one type
    List<TicketCategory> findByTicketTypeOrderByNameAsc(TicketType ticketType);

    // user dropdown: active only
    List<TicketCategory> findByTicketTypeAndActiveTrueOrderByNameAsc(TicketType ticketType);

    // name must be unique per type (case ignored)
    boolean existsByTicketTypeAndNameIgnoreCase(TicketType ticketType, String name);

    // same check while editing, skip the row itself
    boolean existsByTicketTypeAndNameIgnoreCaseAndIdNot(TicketType ticketType, String name, Long id);
}