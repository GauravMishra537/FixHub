package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {

    // timeline of one ticket, oldest first
    List<TicketHistory> findByTicketIdOrderByCreatedOnAscIdAsc(Long ticketId);

        Page<TicketHistory> findAllByOrderByCreatedOnDescIdDesc(Pageable pageable);

    Page<TicketHistory> findByActionOrderByCreatedOnDescIdDesc(HistoryAction action, Pageable pageable);
}