package com.fixhub.infra.service.impl;

import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** Every hour: an approved booking whose last session has ended becomes CLOSED. */
@Component
public class BookingCloser {

    private static final Logger log = LoggerFactory.getLogger(BookingCloser.class);

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;

    public BookingCloser(BookingRepository bookingRepository,
                         TicketRepository ticketRepository,
                         TicketHistoryRepository historyRepository) {
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
    }

    @Scheduled(cron = "0 5 * * * *")
    @Transactional
    public void closeFinished() {
        Instant now = Instant.now();
        List<Long> ids = bookingRepository.findFinishedTicketIds(now);
        for (Long id : ids) {
            Ticket ticket = ticketRepository.findById(id).orElse(null);
            if (ticket == null || ticket.getStatus() != TicketStatus.APPROVED) {
                continue;
            }
            ticket.setStatus(TicketStatus.CLOSED);
            ticket.setClosedOn(now);
            ticketRepository.save(ticket);

            // no actor: the system did it
            TicketHistory row = new TicketHistory();
            row.setTicketId(id);
            row.setAction(HistoryAction.UPDATED);
            row.setFieldName("status");
            row.setFromValue(TicketStatus.APPROVED.name());
            row.setToValue(TicketStatus.CLOSED.name());
            row.setNote("All sessions ended");
            historyRepository.save(row);
        }
        if (!ids.isEmpty()) {
            log.info("Closed {} finished infra bookings", ids.size());
        }
    }
}