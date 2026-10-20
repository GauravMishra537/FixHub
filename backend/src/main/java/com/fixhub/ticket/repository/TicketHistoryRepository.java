package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {

    // timeline of one ticket, oldest first
    List<TicketHistory> findByTicketIdOrderByCreatedOnAscIdAsc(Long ticketId);
}