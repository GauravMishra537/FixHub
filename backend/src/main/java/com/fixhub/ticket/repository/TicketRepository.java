package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // blocks deleting a category that tickets still use
    boolean existsByCategoryId(Long categoryId);

    // next number from the DB sequence, safe when many requests come at once
    @Query(value = "SELECT nextval('ticket_no_seq')", nativeQuery = true)
    Long nextTicketNumber();
}