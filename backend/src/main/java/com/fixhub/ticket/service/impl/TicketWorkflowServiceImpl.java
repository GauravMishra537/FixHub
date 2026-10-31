package com.fixhub.ticket.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketTransitionRequestDto;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.WorkflowAction;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.service.TicketLifecycleHook;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.ticket.service.TicketService;
import com.fixhub.ticket.service.TicketWorkflow;
import com.fixhub.ticket.service.TicketWorkflowService;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
public class TicketWorkflowServiceImpl implements TicketWorkflowService {

    private static final int MAX_NOTE = 500;
    private static final int MAX_MESSAGE = 255;

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final TicketService ticketService;
    private final NotificationService notificationService;
    private final TicketWorkflow workflow;
    private final TicketRules rules;
    private final List<TicketLifecycleHook> hooks;

    public TicketWorkflowServiceImpl(TicketRepository ticketRepository,
                                     TicketHistoryRepository historyRepository,
                                     UserRepository userRepository,
                                     TicketService ticketService,
                                     NotificationService notificationService,
                                     TicketWorkflow workflow,
                                     TicketRules rules,
                                    List<TicketLifecycleHook> hooks) {
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.ticketService = ticketService;
        this.notificationService = notificationService;
        this.workflow = workflow;
        this.rules = rules;
        this.hooks=hooks;
    }

    @Override
    @Transactional
    public TicketResponseDto transition(Long ticketId, TicketTransitionRequestDto request, TicketActor actor) {
        WorkflowAction action = request.getAction();

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }

        // the user looked at an old copy of the page
        if (!Objects.equals(request.getVersion(), ticket.getVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This ticket was changed by someone else. Reload the page and try again");
        }

        String denied = workflow.deniedReason(ticket, action, actor.id(), actor.admin());
        if (denied != null) {
            boolean involved = actor.id().equals(ticket.getAuthorId())
                    || actor.id().equals(ticket.getAssigneeId())
                    || (actor.admin() && (action == WorkflowAction.CONFIRM
                            || action == WorkflowAction.APPROVE
                            || action == WorkflowAction.REJECT
                            || action == WorkflowAction.CANCEL));
                    }

        String note = request.getNote() == null ? "" : request.getNote().trim();
        if (action.noteRequired() && note.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reason is required for this action");
        }
        if (note.length() > MAX_NOTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note cannot exceed " + MAX_NOTE + " characters");
        }

        TicketStatus before = ticket.getStatus();
        TicketStatus after = workflow.targetStatus(ticket.getType(), action);
        Instant now = Instant.now();

        ticket.setStatus(after);
        switch (action) {
            case RESOLVE -> ticket.setResolvedOn(now);
            case CONFIRM -> ticket.setClosedOn(now);
            case REOPEN -> {
                ticket.setReopenCount(ticket.getReopenCount() + 1);
                ticket.setResolvedOn(null);
            }
            default -> {
                // start, hold, resume and cancel only change the status
            }
        }
        // flush now so the new version number is in the answer
        ticketRepository.saveAndFlush(ticket);

                // a type with its own rows (infra sessions) follows the status here, in the same transaction
        for (TicketLifecycleHook hook : hooks) {
            if (hook.type() == ticket.getType()) {
                hook.onTransition(ticket, action, before, after, actor.id(), note);
            }
        }

        log(ticketId, actor.id(), before, after, note);
        notifyOtherSide(ticket, action, actor.id(), note);

        return ticketService.get(ticketId, actor);
    }

    // ---------- helpers ----------

    // one timeline row: status: from -> to, with the note when there is one
    private void log(Long ticketId, Long actorId, TicketStatus from, TicketStatus to, String note) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actorId);
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName("status");
        row.setFromValue(from.name());
        row.setToValue(to.name());
        row.setNote(note.isEmpty() ? null : note);
        historyRepository.save(row);
    }

    // the assignee works, the requester or an admin closes. each side hears about the other's move
    private void notifyOtherSide(Ticket ticket, WorkflowAction action, Long actorId, String note) {
        String who = userName(actorId);
        String label = ticket.getTicketNo() + " (" + ticket.getTitle() + ")";
        String reason = note.isEmpty() ? "" : ": " + note;

        if (ticket.getType() == TicketType.INFRA_BOOKING) {
            notifyInfra(ticket, action, actorId, who, label, reason);
            return;
        }

        switch (action) {
            case START -> tell(ticket.getAuthorId(), actorId, NotificationType.TICKET_STATUS, ticket,
                    who + " started work on " + label);
            case HOLD -> tell(ticket.getAuthorId(), actorId, NotificationType.TICKET_STATUS, ticket,
                    who + " put " + label + " on hold" + reason);
            case RESUME -> tell(ticket.getAuthorId(), actorId, NotificationType.TICKET_STATUS, ticket,
                    who + " resumed work on " + label);
            case RESOLVE -> tell(ticket.getAuthorId(), actorId, NotificationType.TICKET_RESOLVED, ticket,
                    label + " was resolved. Please confirm or reopen it" + reason);
            case CONFIRM -> {
                // the requester and the assignee both hear who closed it. the person who did it hears nothing
                tell(ticket.getAuthorId(), actorId, NotificationType.TICKET_CLOSED, ticket,
                        who + " closed " + label);
                tell(ticket.getAssigneeId(), actorId, NotificationType.TICKET_CLOSED, ticket,
                        who + " closed " + label);
            }
            case REOPEN -> tell(ticket.getAssigneeId(), actorId, NotificationType.TICKET_REOPENED, ticket,
                    who + " reopened " + label + reason);
            case CANCEL -> tell(ticket.getAssigneeId(), actorId, NotificationType.TICKET_CANCELLED, ticket,
                    who + " cancelled " + label);

            default ->{}
        }
    }

        // infra booking: the author hears the admin's decision. the admins hear a cancel through the infra hook
    private void notifyInfra(Ticket ticket, WorkflowAction action, Long actorId,
                             String who, String label, String reason) {
        switch (action) {
            case APPROVE -> tell(ticket.getAuthorId(), actorId, NotificationType.BOOKING_APPROVED, ticket,
                    label + " was approved");
            case REJECT -> tell(ticket.getAuthorId(), actorId, NotificationType.BOOKING_REJECTED, ticket,
                    label + " was rejected" + reason);
            case CANCEL -> tell(ticket.getAuthorId(), actorId, NotificationType.BOOKING_CANCELLED, ticket,
                    who + " cancelled " + label + reason);
            default -> {
                // no other action exists for infra booking
            }
        }
    }

    // one message to one person. nothing when nobody is there or that person did the action
    private void tell(Long userId, Long actorId, NotificationType type, Ticket ticket, String message) {
        if (userId == null || userId.equals(actorId)) {
            return;
        }
        String text = message.length() > MAX_MESSAGE ? message.substring(0, MAX_MESSAGE) : message;
        notificationService.notifyUsers(List.of(userId), type, ticket.getId(), text);
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }
}