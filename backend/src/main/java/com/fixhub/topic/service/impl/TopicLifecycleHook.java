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
import com.fixhub.topic.entity.TopicDecline;
import com.fixhub.topic.repository.TopicDeclineRepository;
import com.fixhub.topic.service.TopicAccess;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * "I'm busy": the helper leaves. The ticket goes back to the queue with no helper,
 * the helper cannot claim it again, the admins and the other skilled users are told.
 */
@Component
public class TopicLifecycleHook implements TicketLifecycleHook {

    private static final int MAX_MESSAGE = 255;
    private static final int MAX_NOTE = 500;

    private final TicketClaimRepository claimRepository;
    private final TopicDeclineRepository declineRepository;
    private final TopicAccess access;
    private final TicketHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TopicLifecycleHook(TicketClaimRepository claimRepository,
                              TopicDeclineRepository declineRepository,
                              TopicAccess access,
                              TicketHistoryRepository historyRepository,
                              UserRepository userRepository,
                              NotificationService notificationService) {
        this.claimRepository = claimRepository;
        this.declineRepository = declineRepository;
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
        if (action != WorkflowAction.BUSY) {
            return null;
        }
        String reason = note == null ? "" : note.trim();
        String reasonCut = reason.length() > MAX_NOTE ? reason.substring(0, MAX_NOTE) : reason;
        String helperName = userRepository.findById(actorId).map(User::getFullName).orElse("#" + actorId);

        // the approved claim ends. the decline row stops a second claim by the same person
        claimRepository.findByTicketIdAndUserIdAndStatusIn(ticket.getId(), actorId, List.of(ClaimStatus.APPROVED))
                .ifPresent(c -> {
                    c.setStatus(ClaimStatus.WITHDRAWN);
                    c.setDecidedBy(actorId);
                    c.setDecidedOn(Instant.now());
                    claimRepository.save(c);
                });
        declineRepository.save(new TopicDecline(ticket.getId(), actorId, reasonCut));

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

        notifyBusy(ticket, actorId, helperName, reason);
        return null;
    }

    private void notifyBusy(Ticket ticket, Long actorId, String helperName, String reason) {
        String label = ticket.getTicketNo() + " (" + ticket.getTitle() + ")";
        String why = reason.isEmpty() ? "" : ": " + reason;

        // admins can assign someone else
        List<Long> admins = userRepository.findIdsByRole(Role.ADMIN).stream()
                .filter(id -> !id.equals(actorId))
                .toList();
        send(admins, NotificationType.TOPIC_HELPER_BUSY, ticket,
                helperName + " is busy and left " + label + why + ". Please assign another helper");

        // other skilled people can click "I can help". not the one who left, not earlier decliners
        Set<Long> skip = new HashSet<>(declineRepository.findByTicketIdOrderByCreatedOnAsc(ticket.getId()).stream()
                .map(TopicDecline::getUserId)
                .collect(Collectors.toSet()));
        skip.add(actorId);
        List<Long> others = access.helperIds(ticket).stream().filter(id -> !skip.contains(id)).toList();
        send(others, NotificationType.TOPIC_HELP_NEEDED, ticket, "Help needed again on " + label);

        // the author hears that a new helper is being found
        if (!ticket.getAuthorId().equals(actorId)) {
            send(List.of(ticket.getAuthorId()), NotificationType.TICKET_STATUS, ticket,
                    helperName + " is busy. We are finding another helper for " + label);
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