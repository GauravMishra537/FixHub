package com.fixhub.topic.service.impl;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.topic.dto.TopicHelperDto;
import com.fixhub.topic.dto.TopicHelpersDto;
import com.fixhub.topic.entity.TopicDecline;
import com.fixhub.topic.repository.TopicDeclineRepository;
import com.fixhub.topic.service.TopicAccess;
import com.fixhub.topic.service.TopicHelperService;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TopicHelperServiceImpl implements TopicHelperService {

    private final TicketRepository ticketRepository;
    private final TopicAccess access;
    private final TopicDeclineRepository declineRepository;
    private final UserRepository userRepository;

    public TopicHelperServiceImpl(TicketRepository ticketRepository,
                                  TopicAccess access,
                                  TopicDeclineRepository declineRepository,
                                  UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.access = access;
        this.declineRepository = declineRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public TopicHelpersDto candidates(Long ticketId, TicketActor actor) {
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an admin can do this");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (ticket.getType() != TicketType.TOPIC_REQUEST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This is not a topic request");
        }

        List<Long> ids = access.helperIds(ticket);
        boolean nobody = ids.isEmpty();
        if (nobody) {
            // fallback: any normal user except the author
            ids = userRepository.findIdsByRole(Role.USER).stream()
                    .filter(id -> !id.equals(ticket.getAuthorId()))
                    .toList();
        }
        if (ids.isEmpty()) {
            return new TopicHelpersDto(nobody, List.of());
        }

        Set<Long> busy = new HashSet<>(declineRepository.findByTicketIdOrderByCreatedOnAsc(ticketId).stream()
                .map(TopicDecline::getUserId)
                .collect(Collectors.toSet()));

        List<TopicHelperDto> users = userRepository.findAllById(ids).stream()
                .map(u -> new TopicHelperDto(u.getId(), u.getFullName(), busy.contains(u.getId())))
                .sorted(Comparator.comparing(TopicHelperDto::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new TopicHelpersDto(nobody, users);
    }
}