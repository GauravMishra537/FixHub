package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    // the thread of one ticket, oldest first
    List<TicketComment> findByTicketIdOrderByCreatedOnAscIdAsc(Long ticketId);

    // a comment, only when it belongs to this ticket
    Optional<TicketComment> findByIdAndTicketId(Long id, Long ticketId);
}