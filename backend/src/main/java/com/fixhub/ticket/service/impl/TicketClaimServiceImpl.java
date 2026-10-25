 package com.fixhub.ticket.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.dto.TicketClaimResponseDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.entity.ClaimStatus;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketClaim;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.repository.TicketClaimRepository;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketClaimService;
import com.fixhub.ticket.service.TicketHistoryService;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.ticket.service.TicketService;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.ticket.dto.ClaimStateDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TicketClaimServiceImpl implements TicketClaimService {

    private static final int MAX_NOTE = 500;

    private final TicketRepository ticketRepository;
    private final TicketClaimRepository claimRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketHistoryService historyService;
    private final UserRepository userRepository;
    private final TicketService ticketService;
    private final NotificationService notificationService;
    private final TicketRules rules;

    public TicketClaimServiceImpl(TicketRepository ticketRepository,
                                  TicketClaimRepository claimRepository,
                                  TicketHistoryRepository historyRepository,
                                  TicketHistoryService historyService,
                                  UserRepository userRepository,
                                  TicketService ticketService,
                                  NotificationService notificationService,
                                  TicketRules rules) {
        this.ticketRepository = ticketRepository;
        this.claimRepository = claimRepository;
        this.historyRepository = historyRepository;
        this.historyService = historyService;
        this.userRepository = userRepository;
        this.ticketService = ticketService;
        this.notificationService = notificationService;
        this.rules = rules;
    }

    // ================= employee =================

    @Override
    @Transactional
    public TicketResponseDto claim(Long ticketId, TicketActor actor) {
        Ticket ticket = findTicket(ticketId);
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }

        Long departmentId = userRepository.findById(actor.id()).map(User::getDepartmentId).orElse(null);
        String denied = rules.claimDeniedReason(ticket, actor.id(), departmentId, actor.admin());
        if (denied != null) {
            throw new ResponseStatusException(actor.admin() ? HttpStatus.FORBIDDEN : HttpStatus.CONFLICT, denied);
        }

        boolean alreadyClaimed = claimRepository
                .findByTicketIdAndUserIdAndStatusIn(ticketId, actor.id(),
                        List.of(ClaimStatus.PENDING, ClaimStatus.APPROVED))
                .isPresent();
        if (alreadyClaimed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already claimed this ticket");
        }

        TicketClaim claim = new TicketClaim();
        claim.setTicketId(ticketId);
        claim.setUserId(actor.id());

        if (ticket.isRequiresApproval()) {
            // an admin decides
            claim.setStatus(ClaimStatus.PENDING);
            claimRepository.save(claim);
            log(ticketId, actor.id(), HistoryAction.CLAIMED, null, null, null, "Waiting for admin approval");

            notificationService.notifyUsers(userRepository.findIdsByRole(Role.ADMIN),
                    NotificationType.CLAIM_REQUESTED, ticketId,
                    userName(actor.id()) + " wants to take " + label(ticket));
        } else {
            // first one wins. a second person at the same moment gets a version conflict
            claim.setStatus(ClaimStatus.APPROVED);
            claim.setDecidedBy(actor.id());
            claim.setDecidedOn(Instant.now());
            claimRepository.save(claim);
            log(ticketId, actor.id(), HistoryAction.CLAIMED, null, null, null, "Took the ticket");
            applyAssignee(ticket, actor.id(), actor.id(), false);
        }

        return ticketService.get(ticketId, actor);
    }

    @Override
    @Transactional
    public TicketResponseDto withdraw(Long ticketId, TicketActor actor) {
        Ticket ticket = findTicket(ticketId);
        TicketClaim claim = claimRepository
                .findByTicketIdAndUserIdAndStatusIn(ticketId, actor.id(), List.of(ClaimStatus.PENDING))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "You have no waiting claim on this ticket"));

        closeClaim(ticket, claim, ClaimStatus.WITHDRAWN, actor.id(), null, HistoryAction.CLAIM_WITHDRAWN);
        return ticketService.get(ticketId, actor);
    }

        @Override
    @Transactional(readOnly = true)
    public ClaimStateDto myState(Long ticketId, TicketActor actor) {
        Ticket ticket = findTicket(ticketId);
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }

        Long departmentId = userRepository.findById(actor.id()).map(User::getDepartmentId).orElse(null);
        String denied = rules.claimDeniedReason(ticket, actor.id(), departmentId, actor.admin());

        ClaimStatus mine = claimRepository
                .findByTicketIdAndUserIdAndStatusIn(ticketId, actor.id(),
                        List.of(ClaimStatus.PENDING, ClaimStatus.APPROVED))
                .map(TicketClaim::getStatus)
                .orElse(null);

        return new ClaimStateDto(denied == null && mine == null, mine, ticket.isRequiresApproval());
    }

    // ================= admin =================

    @Override
    @Transactional(readOnly = true)
    public List<TicketClaimResponseDto> claims(Long ticketId, TicketActor actor) {
        requireAdmin(actor);
        findTicket(ticketId);

        List<TicketClaim> rows = claimRepository.findByTicketIdOrderByCreatedOnAsc(ticketId);
        Set<Long> userIds = rows.stream().map(TicketClaim::getUserId).collect(Collectors.toSet());
        Map<Long, String> names = userIds.isEmpty() ? Map.of()
                : userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));

        return rows.stream()
                .map(c -> new TicketClaimResponseDto(c.getId(), c.getTicketId(), c.getUserId(),
                        names.get(c.getUserId()), c.getStatus(), c.getRejectReason(), c.getCreatedOn()))
                .toList();
    }

    @Override
    @Transactional
    public TicketResponseDto approveClaim(Long ticketId, Long claimId, TicketActor actor) {
        requireAdmin(actor);
        Ticket ticket = findTicket(ticketId);
        TicketClaim claim = pendingClaim(ticketId, claimId);
        if (!isWaiting(ticket)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket already has an assignee");
        }

        closeClaim(ticket, claim, ClaimStatus.APPROVED, actor.id(), null, HistoryAction.CLAIM_APPROVED);
        rejectOtherWaitingClaims(ticket, claim.getUserId(), actor.id(), "Another employee was chosen");
        // the claimant already got "claim approved", so no second message
        applyAssignee(ticket, claim.getUserId(), actor.id(), false);

        return ticketService.get(ticketId, actor);
    }

    @Override
    @Transactional
    public TicketResponseDto rejectClaim(Long ticketId, Long claimId, String reason, TicketActor actor) {
        requireAdmin(actor);
        Ticket ticket = findTicket(ticketId);
        TicketClaim claim = pendingClaim(ticketId, claimId);

        String clean = reason == null ? "" : reason.trim();
        if (clean.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required");
        }
        closeClaim(ticket, claim, ClaimStatus.REJECTED, actor.id(), clean, HistoryAction.CLAIM_REJECTED);

        return ticketService.get(ticketId, actor);
    }

    @Override
    @Transactional
    public TicketResponseDto assign(Long ticketId, Long userId, TicketActor actor) {
        requireAdmin(actor);
        Ticket ticket = findTicket(ticketId);
        if (!rules.canTriage(ticket, true)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is finished");
        }
        if (Objects.equals(ticket.getAssigneeId(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The ticket is already assigned to this person");
        }
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        // the old person's approved claim ends, so they can claim again later
        Long oldAssignee = ticket.getAssigneeId();
        if (oldAssignee != null) {
            claimRepository.findByTicketIdAndUserIdAndStatusIn(ticketId, oldAssignee, List.of(ClaimStatus.APPROVED))
                    .ifPresent(c -> closeClaim(ticket, c, ClaimStatus.WITHDRAWN, actor.id(), null, null));
            tell(oldAssignee, actor.id(), NotificationType.TICKET_UNASSIGNED, ticket,
                    label(ticket) + " was given to someone else");
        }

        // waiting claims: the chosen person's claim is approved, the others are rejected
        boolean chosenHadClaim = false;
        for (TicketClaim waiting : claimRepository.findByTicketIdAndStatusOrderByCreatedOnAsc(
                ticketId, ClaimStatus.PENDING)) {
            if (waiting.getUserId().equals(userId)) {
                chosenHadClaim = true;
                closeClaim(ticket, waiting, ClaimStatus.APPROVED, actor.id(), null, HistoryAction.CLAIM_APPROVED);
            } else {
                closeClaim(ticket, waiting, ClaimStatus.REJECTED, actor.id(),
                        "The admin assigned the ticket to someone else", HistoryAction.CLAIM_REJECTED);
            }
        }

        // a person who had a claim already heard "approved". others hear "assigned to you"
        applyAssignee(ticket, userId, actor.id(), !chosenHadClaim);
        return ticketService.get(ticketId, actor);
    }

    @Override
    @Transactional
    public TicketResponseDto unassign(Long ticketId, TicketActor actor) {
        requireAdmin(actor);
        Ticket ticket = findTicket(ticketId);
        if (ticket.getAssigneeId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No one is assigned to this ticket");
        }
        if (ticket.getStatus() != TicketStatus.ASSIGNED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Work has started on this ticket, so it cannot be taken back");
        }

        Long oldAssignee = ticket.getAssigneeId();
        claimRepository.findByTicketIdAndUserIdAndStatusIn(ticketId, oldAssignee, List.of(ClaimStatus.APPROVED))
                .ifPresent(c -> closeClaim(ticket, c, ClaimStatus.WITHDRAWN, actor.id(), null, null));

        String before = ticket.getStatus().name();
        ticket.setAssigneeId(null);
        ticket.setStatus(TicketStatus.NEW);
        ticketRepository.saveAndFlush(ticket);

        historyService.recordFieldChange(ticketId, actor.id(), "status", before, TicketStatus.NEW.name());
        log(ticketId, actor.id(), HistoryAction.UNASSIGNED, "assignee", userName(oldAssignee), null, null);
        tell(oldAssignee, actor.id(), NotificationType.TICKET_UNASSIGNED, ticket,
                label(ticket) + " was taken back by the admin");

        return ticketService.get(ticketId, actor);
    }

    // ================= helpers =================

    private void requireAdmin(TicketActor actor) {
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an admin can do this");
        }
    }

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private TicketClaim pendingClaim(Long ticketId, Long claimId) {
        TicketClaim claim = claimRepository.findById(claimId)
                .filter(c -> c.getTicketId().equals(ticketId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This claim is not waiting any more");
        }
        return claim;
    }

    // nobody has it yet and it is still in the department queue
    private boolean isWaiting(Ticket ticket) {
        return ticket.getAssigneeId() == null && rules.queueStatuses().contains(ticket.getStatus());
    }

    private void rejectOtherWaitingClaims(Ticket ticket, Long keepUserId, Long adminId, String reason) {
        for (TicketClaim other : claimRepository.findByTicketIdAndStatusOrderByCreatedOnAsc(
                ticket.getId(), ClaimStatus.PENDING)) {
            if (!other.getUserId().equals(keepUserId)) {
                closeClaim(ticket, other, ClaimStatus.REJECTED, adminId, reason, HistoryAction.CLAIM_REJECTED);
            }
        }
    }

    // end a claim with a result and tell the claimant. action null = no timeline row
    private void closeClaim(Ticket ticket, TicketClaim claim, ClaimStatus status, Long decidedBy,
                            String reason, HistoryAction action) {
        claim.setStatus(status);
        claim.setDecidedBy(decidedBy);
        claim.setDecidedOn(Instant.now());
        claim.setRejectReason(reason);
        claimRepository.save(claim);

        if (action != null) {
            log(claim.getTicketId(), decidedBy, action, "claimant", null, userName(claim.getUserId()), reason);
        }

        if (status == ClaimStatus.APPROVED) {
            tell(claim.getUserId(), decidedBy, NotificationType.CLAIM_APPROVED, ticket,
                    "Your claim on " + label(ticket) + " was approved");
        } else if (status == ClaimStatus.REJECTED) {
            tell(claim.getUserId(), decidedBy, NotificationType.CLAIM_REJECTED, ticket,
                    "Your claim on " + label(ticket) + " was rejected: " + reason);
        }
    }

    // the ticket gets its person. a ticket still in the queue moves to ASSIGNED, a started one keeps its status.
    // tellAssignee false = the new person was already told another way
    private void applyAssignee(Ticket ticket, Long assigneeId, Long actorId, boolean tellAssignee) {
        String before = ticket.getStatus().name();
        String oldName = ticket.getAssigneeId() == null ? null : userName(ticket.getAssigneeId());

        ticket.setAssigneeId(assigneeId);
        if (rules.queueStatuses().contains(ticket.getStatus())) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }
        ticketRepository.saveAndFlush(ticket);

        historyService.recordFieldChange(ticket.getId(), actorId, "status", before, ticket.getStatus().name());
        log(ticket.getId(), actorId, HistoryAction.ASSIGNED, "assignee", oldName, userName(assigneeId), null);

        if (tellAssignee) {
            tell(assigneeId, actorId, NotificationType.TICKET_ASSIGNED, ticket,
                    label(ticket) + " was assigned to you");
        }
        // the author hears who works on the ticket now (not when the author did it, or is the person)
        if (!Objects.equals(ticket.getAuthorId(), assigneeId)) {
            tell(ticket.getAuthorId(), actorId, NotificationType.TICKET_TAKEN, ticket,
                    label(ticket) + " is now handled by " + userName(assigneeId));
        }
    }

    // one message to one person. nothing when that person did the action themselves
    private void tell(Long userId, Long actorId, NotificationType type, Ticket ticket, String message) {
        if (userId == null || userId.equals(actorId)) {
            return;
        }
        notificationService.notifyUsers(List.of(userId), type, ticket.getId(), message);
    }

    private String label(Ticket ticket) {
        return ticket.getTicketNo() + " (" + ticket.getTitle() + ")";
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    // one timeline row
    private void log(Long ticketId, Long actorId, HistoryAction action,
                     String field, String from, String to, String note) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actorId);
        row.setAction(action);
        row.setFieldName(field);
        row.setFromValue(from);
        row.setToValue(to);
        row.setNote(note == null ? null : (note.length() > MAX_NOTE ? note.substring(0, MAX_NOTE) : note));
        historyRepository.save(row);
    }
}