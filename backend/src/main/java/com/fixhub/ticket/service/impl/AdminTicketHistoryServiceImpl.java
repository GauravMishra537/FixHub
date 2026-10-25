package com.fixhub.ticket.service.impl;

import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.AdminTicketHistoryDto;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.AdminTicketHistoryService;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminTicketHistoryServiceImpl implements AdminTicketHistoryService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 50;

    private final TicketHistoryRepository historyRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public AdminTicketHistoryServiceImpl(TicketHistoryRepository historyRepository,
                                         TicketRepository ticketRepository,
                                         UserRepository userRepository) {
        this.historyRepository = historyRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminTicketHistoryDto> list(String action, int page, int size) {
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);

        Page<TicketHistory> rows;
        if (action == null || action.isBlank()) {
            rows = historyRepository.findAllByOrderByCreatedOnDescIdDesc(pageable);
        } else {
            rows = historyRepository.findByActionOrderByCreatedOnDescIdDesc(parse(action), pageable);
        }

        Set<Long> ticketIds = new HashSet<>();
        Set<Long> actorIds = new HashSet<>();
        for (TicketHistory h : rows.getContent()) {
            ticketIds.add(h.getTicketId());
            if (h.getActorId() != null) actorIds.add(h.getActorId());
        }

        Map<Long, String> ticketNos = ticketIds.isEmpty() ? Map.of()
                : ticketRepository.findAllById(ticketIds).stream()
                .collect(Collectors.toMap(Ticket::getId, Ticket::getTicketNo, (a, b) -> a));
        Map<Long, String> users = actorIds.isEmpty() ? Map.of()
                : userRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));

        return PageResponse.of(rows, h -> new AdminTicketHistoryDto(
                h.getId(),
                h.getTicketId(),
                ticketNos.get(h.getTicketId()),
                h.getAction(),
                h.getFieldName(),
                h.getFromValue(),
                h.getToValue(),
                h.getNote(),
                h.getActorId() == null ? null : users.get(h.getActorId()),
                h.getCreatedOn()));
    }

    @Override
    public List<String> actions() {
        return Arrays.stream(HistoryAction.values()).map(Enum::name).toList();
    }

    private HistoryAction parse(String action) {
        try {
            return HistoryAction.valueOf(action.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown event: " + action);
        }
    }
}