package com.fixhub.infra.service.impl;

import com.fixhub.infra.entity.Booking;
import com.fixhub.infra.entity.BookingStatus;
import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.infra.repository.InfraAdminRepository;
import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
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
 * Called by the ticket workflow before the ticket is saved.
 * Approve all and reject all apply to the sessions still waiting. Cancel (author) applies to sessions not started.
 * Returns the final ticket status, worked out from all sessions.
 */
@Component
public class BookingLifecycleHook implements TicketLifecycleHook {

    private final BookingRepository bookingRepository;
    private final InfraAdminRepository adminRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingLifecycleHook(BookingRepository bookingRepository,
                                InfraAdminRepository adminRepository,
                                UserRepository userRepository,
                                NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public TicketType type() {
        return TicketType.INFRA_BOOKING;
    }

    @Override
    public TicketStatus onTransition(Ticket ticket, WorkflowAction action, TicketStatus from, TicketStatus to,
                                     Long actorId, String note) {
        List<Booking> sessions = bookingRepository.findByTicketIdOrderByStartTimeAsc(ticket.getId());
        Instant now = Instant.now();
        String text = note == null || note.isBlank() ? null : note;
        TicketStatus decided = null;

        switch (action) {
            case APPROVE -> {
                boolean any = false;
                for (Booking b : sessions) {
                    if (b.getStatus() != BookingStatus.PENDING) {
                        continue;
                    }
                    if (b.getEndTime().isAfter(now)) {
                        decide(b, BookingStatus.APPROVED, actorId, null);
                        any = true;
                    } else {
                        // the time passed before anyone decided
                        decide(b, BookingStatus.CANCELLED, actorId, "Time passed before a decision");
                    }
                }
                if (!any) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Every session has already ended. Reject this request instead");
                }
                decided = BookingStatuses.resolve(sessions);
            }
            case REJECT -> {
                for (Booking b : sessions) {
                    if (b.getStatus() == BookingStatus.PENDING) {
                        decide(b, BookingStatus.REJECTED, actorId, text);
                    }
                }
                decided = BookingStatuses.resolve(sessions);
            }
            case CANCEL -> {
                // sessions that already started stay as they were
                List<Booking> open = sessions.stream()
                        .filter(b -> AvailabilityServiceImpl.HOLDING.contains(b.getStatus()))
                        .filter(b -> b.getStartTime().isAfter(now))
                        .toList();
                if (open.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Every session has already started. Nothing is left to cancel");
                }
                open.forEach(b -> decide(b, BookingStatus.CANCELLED, actorId, text));
                tellAdminsIfRequesterCancelled(ticket, actorId, text);
            }
            default -> {
                // no other action exists for infra booking
            }
        }
        bookingRepository.saveAll(sessions);
        return decided;
    }

    private void decide(Booking b, BookingStatus status, Long actorId, String note) {
        b.setStatus(status);
        b.setDecidedBy(actorId);
        b.setDecidedOn(Instant.now());
        b.setDecisionNote(note);
    }

    // the author cancelling tells the admins here. an admin never cancels any more
    private void tellAdminsIfRequesterCancelled(Ticket ticket, Long actorId, String note) {
        List<Long> admins = adminRepository.findIdsByRole(Role.ADMIN);
        if (admins.contains(actorId)) {
            return;
        }
        String who = userRepository.findById(actorId).map(User::getFullName).orElse("#" + actorId);
        String message = who + " cancelled " + ticket.getTicketNo() + " (" + ticket.getTitle() + ")"
                + (note == null ? "" : ": " + note);
        notificationService.notifyUsers(admins, NotificationType.BOOKING_CANCELLED, ticket.getId(),
                message.length() > 255 ? message.substring(0, 255) : message);
    }
}