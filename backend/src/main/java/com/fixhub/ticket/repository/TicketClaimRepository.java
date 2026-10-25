package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.ClaimStatus;
import com.fixhub.ticket.entity.TicketClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketClaimRepository extends JpaRepository<TicketClaim, Long> {

    // the live claim of one person on one ticket (pending or approved)
    Optional<TicketClaim> findByTicketIdAndUserIdAndStatusIn(
            Long ticketId, Long userId, Collection<ClaimStatus> statuses);

    // all claims of one status on a ticket, oldest first
    List<TicketClaim> findByTicketIdAndStatusOrderByCreatedOnAsc(Long ticketId, ClaimStatus status);

    // every claim that waits for an admin, oldest first
    List<TicketClaim> findByStatusOrderByCreatedOnAsc(ClaimStatus status);

    // claims of one person on a set of tickets, to show "you claimed this" on cards
    List<TicketClaim> findByUserIdAndTicketIdInAndStatusIn(
            Long userId, Collection<Long> ticketIds, Collection<ClaimStatus> statuses);

        // every claim on a ticket, oldest first, for the admin panel
    List<TicketClaim> findByTicketIdOrderByCreatedOnAsc(Long ticketId);    
        
        }