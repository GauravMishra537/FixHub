package com.fixhub.resource.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.resource.entity.RequestStatus;
import com.fixhub.resource.entity.ResourceRequest;
import com.fixhub.resource.repository.ResourceRequestRepository;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.WorkflowAction;
import com.fixhub.ticket.service.TicketLifecycleHook;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

/**
 * Called by the ticket workflow before the ticket is saved. Moves the request row with the ticket,
 * frees the stock on reject and cancel, and sends every notification for this type.
 * The ticket status is the one the workflow table chose, so this returns null.
 */
@Component
public class ResourceLifecycleHook implements TicketLifecycleHook {

    private static final int MAX_MESSAGE = 255;

    private final ResourceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ResourceLifecycleHook(ResourceRequestRepository requestRepository,
                                 UserRepository userRepository,
                                 NotificationService notificationService) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public TicketType type() {
        return TicketType.RESOURCE_REQUEST;
    }

    @Override
    public TicketStatus onTransition(Ticket ticket, WorkflowAction action, TicketStatus from, TicketStatus to,
                                     Long actorId, String note) {
        ResourceRequest r = requestRepository.findByTicketId(ticket.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "This ticket has no request details"));
        Instant now = Instant.now();
        String text = note == null || note.isBlank() ? null : note;
        String label = ticket.getTicketNo() + " (" + ticket.getTitle() + ")";
        String who = userName(actorId);
        String reason = text == null ? "" : ": " + text;

        switch (action) {
            case DEPT_APPROVE -> {
                expect(r, RequestStatus.PENDING_DEPT);
                r.setStatus(RequestStatus.PENDING_ADMIN);
                r.setDeptDecidedBy(actorId);
                r.setDeptDecidedOn(now);
                r.setDeptNote(text);
                tellAdmins(actorId, NotificationType.RESOURCE_DEPT_APPROVED, ticket,
                        who + " approved " + label + ". It needs your approval" + reason);
            }
            case DEPT_REJECT -> {
                expect(r, RequestStatus.PENDING_DEPT);
                r.setStatus(RequestStatus.REJECTED);
                r.setHolding(false);
                r.setDeptDecidedBy(actorId);
                r.setDeptDecidedOn(now);
                r.setDeptNote(text);
                tell(ticket.getAuthorId(), actorId, NotificationType.RESOURCE_REJECTED, ticket,
                        who + " rejected " + label + reason);
            }
            case APPROVE -> {
                expect(r, RequestStatus.PENDING_ADMIN);
                r.setStatus(RequestStatus.APPROVED);
                r.setAdminDecidedBy(actorId);
                r.setAdminDecidedOn(now);
                r.setAdminNote(text);
                tell(ticket.getAuthorId(), actorId, NotificationType.RESOURCE_APPROVED, ticket,
                        label + " was approved. Close the ticket once you have it" + reason);
            }
            case REJECT -> {
                expect(r, RequestStatus.PENDING_ADMIN);
                r.setStatus(RequestStatus.REJECTED);
                r.setHolding(false);
                r.setAdminDecidedBy(actorId);
                r.setAdminDecidedOn(now);
                r.setAdminNote(text);
                tell(ticket.getAuthorId(), actorId, NotificationType.RESOURCE_REJECTED, ticket,
                        who + " rejected " + label + reason);
            }
            case CLOSE -> {
                // the item stays counted as taken: it was handed over
                expect(r, RequestStatus.APPROVED);
                r.setStatus(RequestStatus.CLOSED);
            }
            case CANCEL -> {
                RequestStatus before = r.getStatus();
                if (before != RequestStatus.PENDING_DEPT && before != RequestStatus.PENDING_ADMIN
                        && before != RequestStatus.APPROVED) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "This request is already " + before);
                }
                r.setStatus(RequestStatus.CANCELLED);
                r.setHolding(false);
                // whoever was waiting to decide hears about it
                if (before == RequestStatus.PENDING_DEPT) {
                    tell(ticket.getAssigneeId(), actorId, NotificationType.RESOURCE_CANCELLED, ticket,
                            who + " cancelled " + label);
                } else {
                    tellAdmins(actorId, NotificationType.RESOURCE_CANCELLED, ticket,
                            who + " cancelled " + label);
                }
            }
            default -> {
                // no other action exists for a resource request
            }
        }
        requestRepository.save(r);
        return null;
    }

    // the request row and the ticket must agree. if not, somebody moved it first
    private void expect(ResourceRequest r, RequestStatus wanted) {
        if (r.getStatus() != wanted) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This request is already " + r.getStatus() + ". Reload the page");
        }
    }

    private void tellAdmins(Long actorId, NotificationType type, Ticket ticket, String message) {
        List<Long> admins = userRepository.findIdsByRole(Role.ADMIN).stream()
                .filter(id -> !id.equals(actorId))
                .toList();
        if (!admins.isEmpty()) {
            notificationService.notifyUsers(admins, type, ticket.getId(), cut(message));
        }
    }

    private void tell(Long userId, Long actorId, NotificationType type, Ticket ticket, String message) {
        if (userId == null || userId.equals(actorId)) {
            return;
        }
        notificationService.notifyUsers(List.of(userId), type, ticket.getId(), cut(message));
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private static String cut(String s) {
        return s.length() > MAX_MESSAGE ? s.substring(0, MAX_MESSAGE) : s;
    }
}