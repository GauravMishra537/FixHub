package com.fixhub.ticket.service.impl;

import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketNumberService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketNumberServiceImpl implements TicketNumberService {

    private final TicketRepository ticketRepository;

    public TicketNumberServiceImpl(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Override
    @Transactional
    public String nextTicketNo() {
        // sequence never gives the same number twice, even for parallel requests.
        // a rolled back ticket leaves a gap in numbers, that is normal.
        Long next = ticketRepository.nextTicketNumber();
        return String.format("FH-%06d", next);
    }
}