package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import java.time.Instant;

import java.util.List;

import java.util.Collection;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

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
               or t.authorId = :viewerId
               or t.assigneeId = :viewerId
            """,
            countQuery = """
            select count(t) from Ticket t
            where :admin = true
               or t.visibility = com.fixhub.ticket.entity.TicketVisibility.PUBLIC
               or t.authorId = :viewerId
               or t.assigneeId = :viewerId
            """)
    Page<Ticket> findVisible(@Param("admin") boolean admin,
                             @Param("viewerId") Long viewerId,
                             Pageable pageable);

    @Query("""
            select count(t) from Ticket t
            where :admin = true
               or t.visibility = com.fixhub.ticket.entity.TicketVisibility.PUBLIC
               or t.authorId = :viewerId
               or t.assigneeId = :viewerId
            """)
    long countVisible(@Param("admin") boolean admin, @Param("viewerId") Long viewerId);

    // ---------- my tickets (raised by me) ----------
    Page<Ticket> findByAuthorId(Long authorId, Pageable pageable);

    Page<Ticket> findByAuthorIdAndStatusIn(Long authorId,
                                              Collection<TicketStatus> statuses,
                                              Pageable pageable);

        Page<Ticket> findByDepartmentIdAndAssigneeIdIsNullAndStatusInAndVisibility(
            Long departmentId, Collection<TicketStatus> statuses, TicketVisibility visibility, Pageable pageable);
            
    long countByAuthorId(Long authorId);

    long countByAuthorIdAndStatusIn(Long authorId, Collection<TicketStatus> statuses);

        // ticket count per category, only tickets this viewer may see. row = [categoryId, count]
    @Query("""
            select t.categoryId, count(t) from Ticket t
            where t.type = :type
              and t.categoryId is not null
              and (:admin = true
                   or t.visibility = com.fixhub.ticket.entity.TicketVisibility.PUBLIC
                   or t.authorId = :viewerId
                   or t.assigneeId = :viewerId)
            group by t.categoryId
            """)
    List<Object[]> countByCategoryVisible(@Param("type") TicketType type,
                                          @Param("admin") boolean admin,
                                          @Param("viewerId") Long viewerId);

         // ---------- work stats of an assignee ----------
    long countByAssigneeIdAndStatusIn(Long assigneeId, Collection<TicketStatus> statuses);

    @Query("""
            select count(t) from Ticket t
            where t.assigneeId = :userId
              and t.status in :statuses
              and t.resolvedOn >= :since
            """)
    long countResolvedSince(@Param("userId") Long userId,
                            @Param("statuses") Collection<TicketStatus> statuses,
                            @Param("since") Instant since);

    // average hours from raised to resolved, over tickets this person resolved
    @Query(value = """
            select avg(extract(epoch from (resolved_on - created_on))) / 3600.0
              from ticket
             where assignee_id = :userId
               and status in ('RESOLVED', 'CLOSED')
               and resolved_on is not null
               and deleted_on is null
            """, nativeQuery = true)
    Double averageHoursToResolve(@Param("userId") Long userId);                                     


}
