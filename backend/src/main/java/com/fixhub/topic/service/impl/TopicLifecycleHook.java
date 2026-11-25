package com.fixhub.topic.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.entity.ClaimStatus;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.WorkflowAction;
import com.fixhub.ticket.repository.TicketClaimRepository;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.service.TicketLifecycleHook;
import com.fixhub.topic.service.TopicAccess;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * "Not solved yet": the ticket goes back to the queue with no helper.
 * Anyone with the skill can take it, the same helper too. The old claim ends so he can claim again.
 */
@Component
public class TopicLifecycleHook implements TicketLifecycleHook {

    private static final int MAX_MESSAGE = 255;
    private static final int MAX_NOTE = 500;

    private final TicketClaimRepository claimRepository;
    private final TopicAccess access;
    private final TicketHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TopicLifecycleHook(TicketClaimRepository claimRepository,
                              TopicAccess access,
                              TicketHistoryRepository historyRepository,
                              UserRepository userRepository,
                              NotificationService notificationService) {
        this.claimRepository = claimRepository;
        this.access = access;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public TicketType type() {
        return TicketType.TOPIC_REQUEST;
    }

    @Override
    public TicketStatus onTransition(Ticket ticket, WorkflowAction action, TicketStatus from, TicketStatus to,
                                     Long actorId, String note) {
        if (action != WorkflowAction.REOPEN || ticket.getAssigneeId() == null) {
            return null;
        }
        Long helperId = ticket.getAssigneeId();
        String reason = note == null ? "" : note.trim();
        String reasonCut = reason.length() > MAX_NOTE ? reason.substring(0, MAX_NOTE) : reason;
        String helperName = userRepository.findById(helperId).map(User::getFullName).orElse("#" + helperId);

        // the old approved claim ends, so the same helper can claim again
        claimRepository.findByTicketIdAndUserIdAndStatusIn(ticket.getId(), helperId, List.of(ClaimStatus.APPROVED))
                .ifPresent(c -> {
                    c.setStatus(ClaimStatus.WITHDRAWN);
                    c.setDecidedBy(actorId);
                    c.setDecidedOn(Instant.now());
                    claimRepository.save(c);
                });

        // no helper any more. the workflow sets the status to OPEN and saves
        ticket.setAssigneeId(null);

        TicketHistory row = new TicketHistory();
        row.setTicketId(ticket.getId());
        row.setActorId(actorId);
        row.setAction(HistoryAction.UNASSIGNED);
        row.setFieldName("assignee");
        row.setFromValue(helperName);
        row.setNote(reasonCut.isEmpty() ? null : reasonCut);
        historyRepository.save(row);

        notifyQueue(ticket, actorId, helperId, reason);
        return null;
    }

    private void notifyQueue(Ticket ticket, Long actorId, Long helperId, String reason) {
        String label = ticket.getTicketNo() + " (" + ticket.getTitle() + ")";
        String why = reason.isEmpty() ? "" : ": " + reason;
        String who = userRepository.findById(actorId).map(User::getFullName).orElse("#" + actorId);

        // the helper who had it hears why. he sees it in the queue again
        send(List.of(helperId), NotificationType.TICKET_REOPENED, ticket,
                who + " says " + label + " is not solved yet" + why + ". It is back in the queue");

        // everyone else with the skill can take it
        List<Long> others = access.helperIds(ticket).stream().filter(id -> !id.equals(helperId)).toList();
        send(others, NotificationType.TOPIC_HELP_NEEDED, ticket, "Help needed again on " + label + why);

        // nobody has the skill at all: an admin picks a helper
        if (access.helperIds(ticket).isEmpty()) {
            List<Long> admins = userRepository.findIdsByRole(Role.ADMIN).stream()
                    .filter(id -> !id.equals(actorId))
                    .toList();
            send(admins, NotificationType.TOPIC_HELP_NEEDED, ticket,
                    "Not solved yet and no one has the skill. Please assign a helper to " + label);
        }
    }

    private void send(List<Long> userIds, NotificationType type, Ticket ticket, String message) {
        if (userIds.isEmpty()) {
            return;
        }
        notificationService.notifyUsers(userIds, type, ticket.getId(),
                message.length() > MAX_MESSAGE ? message.substring(0, MAX_MESSAGE) : message);
    }
}