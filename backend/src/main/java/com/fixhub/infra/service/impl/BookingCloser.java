package com.fixhub.infra.service.impl;

import com.fixhub.infra.entity.Booking;
import com.fixhub.infra.entity.BookingStatus;
import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Keeps booking tickets in step with the clock.
 * - approved, and every approved session has ended: ticket becomes CLOSED
 * - still pending, and every session has ended: ticket becomes CANCELLED (nobody decided in time)
 * Runs once when the app starts (catches up after the app was off) and then every 10 minutes.
 */
@Component
public class BookingCloser {

    private static final Logger log = LoggerFactory.getLogger(BookingCloser.class);
    private static final String EXPIRED = "No decision before the time passed";

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final NotificationService notificationService;

    public BookingCloser(BookingRepository bookingRepository,
                         TicketRepository ticketRepository,
                         TicketHistoryRepository historyRepository,
                         NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.notificationService = notificationService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onStart() {
        sweep();
    }

    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void onSchedule() {
        sweep();
    }

    // a failure here must never stop the app from starting
    private void sweep() {
        try {
            Instant now = Instant.now();
            int closed = closeFinished(now);
            int expired = expirePending(now);
            if (closed + expired > 0) {
                log.info("Infra bookings: closed {}, expired {}", closed, expired);
            }
        } catch (RuntimeException e) {
            log.error("Infra booking sweep failed", e);
        }
    }

    private int closeFinished(Instant now) {
        List<Long> ids = bookingRepository.findFinishedTicketIds(now);
        int count = 0;
        for (Long id : ids) {
            Ticket ticket = ticketRepository.findById(id).orElse(null);
            if (ticket == null || ticket.getStatus() != TicketStatus.APPROVED) {
                continue;
            }
            ticket.setStatus(TicketStatus.CLOSED);
            ticket.setClosedOn(now);
            ticketRepository.save(ticket);
            history(id, TicketStatus.APPROVED, TicketStatus.CLOSED, "All sessions ended");
            count++;
        }
        return count;
    }

    private int expirePending(Instant now) {
        List<Long> ids = bookingRepository.findExpiredPendingTicketIds(now);
        int count = 0;
        for (Long id : ids) {
            Ticket ticket = ticketRepository.findById(id).orElse(null);
            if (ticket == null || ticket.getStatus() != TicketStatus.PENDING_APPROVAL) {
                continue;
            }
            List<Booking> sessions = bookingRepository.findByTicketIdOrderByStartTimeAsc(id);
            for (Booking b : sessions) {
                if (b.getStatus() == BookingStatus.PENDING) {
                    b.setStatus(BookingStatus.CANCELLED);
                    b.setDecidedOn(now);
                    b.setDecisionNote(EXPIRED);
                }
            }
            bookingRepository.saveAll(sessions);

            ticket.setStatus(TicketStatus.CANCELLED);
            ticketRepository.save(ticket);
            history(id, TicketStatus.PENDING_APPROVAL, TicketStatus.CANCELLED, EXPIRED);

            String message = ticket.getTicketNo() + " (" + ticket.getTitle() + ") expired. " + EXPIRED;
            notificationService.notifyUsers(List.of(ticket.getAuthorId()), NotificationType.BOOKING_CANCELLED, id,
                    message.length() > 255 ? message.substring(0, 255) : message);
            count++;
        }
        return count;
    }

    // no actor: the system did it
    private void history(Long ticketId, TicketStatus from, TicketStatus to, String note) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName("status");
        row.setFromValue(from.name());
        row.setToValue(to.name());
        row.setNote(note);
        historyRepository.save(row);
    }
}