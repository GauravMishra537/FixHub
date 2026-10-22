package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // blocks deleting a category that tickets still use
    boolean existsByCategoryId(Long categoryId);

    // next number from the DB sequence, safe when many requests come at once
    @Query(value = "SELECT nextval('ticket_no_seq')", nativeQuery = true)
    Long nextTicketNumber();

    // ---------- all tickets this viewer may see ----------
    // admin sees all. others: public ones, plus private ones they raised or are assigned to
    @Query(value = """
            select t from Ticket t
            where :admin = true
               or t.visibility = com.fixhub.ticket.entity.TicketVisibility.PUBLIC
               or t.requesterId = :viewerId
               or t.assigneeId = :viewerId
            """,
            countQuery = """
            select count(t) from Ticket t
            where :admin = true
               or t.visibility = com.fixhub.ticket.entity.TicketVisibility.PUBLIC
               or t.requesterId = :viewerId
               or t.assigneeId = :viewerId
            """)
    Page<Ticket> findVisible(@Param("admin") boolean admin,
                             @Param("viewerId") Long viewerId,
                             Pageable pageable);

    @Query("""
            select count(t) from Ticket t
            where :admin = true
               or t.visibility = com.fixhub.ticket.entity.TicketVisibility.PUBLIC
               or t.requesterId = :viewerId
               or t.assigneeId = :viewerId
            """)
    long countVisible(@Param("admin") boolean admin, @Param("viewerId") Long viewerId);

    // ---------- my tickets (raised by me) ----------
    Page<Ticket> findByRequesterId(Long requesterId, Pageable pageable);

    Page<Ticket> findByRequesterIdAndStatusIn(Long requesterId,
                                              Collection<TicketStatus> statuses,
                                              Pageable pageable);

    long countByRequesterId(Long requesterId);

    long countByRequesterIdAndStatusIn(Long requesterId, Collection<TicketStatus> statuses);
}