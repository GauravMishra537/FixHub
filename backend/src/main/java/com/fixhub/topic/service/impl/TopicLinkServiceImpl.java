package com.fixhub.topic.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.topic.dto.TopicLinkDto;
import com.fixhub.topic.dto.TopicLinkRequestDto;
import com.fixhub.topic.entity.LinkKind;
import com.fixhub.topic.entity.TopicLink;
import com.fixhub.topic.repository.TopicLinkRepository;
import com.fixhub.topic.service.TopicLinkService;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TopicLinkServiceImpl implements TopicLinkService {

    private static final int MAX_TITLE = 200;
    private static final int MAX_URL = 1000;
    private static final int MAX_LINKS = 20;
    private static final int MAX_MESSAGE = 255;

    // like files: nothing is added or removed once the ticket is finished
    private static final Set<TicketStatus> FINISHED = Set.of(
            TicketStatus.CLOSED, TicketStatus.CANCELLED, TicketStatus.REJECTED, TicketStatus.RETURNED);

    private final TicketRepository ticketRepository;
    private final TopicLinkRepository linkRepository;
    private final TicketHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TicketRules rules;

    public TopicLinkServiceImpl(TicketRepository ticketRepository,
                                TopicLinkRepository linkRepository,
                                TicketHistoryRepository historyRepository,
                                UserRepository userRepository,
                                NotificationService notificationService,
                                TicketRules rules) {
        this.ticketRepository = ticketRepository;
        this.linkRepository = linkRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.rules = rules;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicLinkDto> list(Long ticketId, TicketActor actor) {
        findViewableTopic(ticketId, actor);
        List<TopicLink> rows = linkRepository.findByTicketIdOrderByIdAsc(ticketId);
        Map<Long, String> names = userNames(rows);
        return rows.stream().map(l -> toDto(l, names, actor)).toList();
    }

    @Override
    @Transactional
    public TopicLinkDto add(Long ticketId, TopicLinkRequestDto request, TicketActor actor) {
        Ticket ticket = findViewableTopic(ticketId, actor);

        boolean helper = actor.id().equals(ticket.getAssigneeId());
        if (!helper && !actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the helper or an admin can add learning material");
        }
        if (FINISHED.contains(ticket.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is finished. Links cannot be added");
        }
        if (request == null) {
            throw bad("Link details are required");
        }

        String url = request.url() == null ? "" : request.url().trim();
        String title = request.title() == null ? "" : request.title().trim();
        if (url.isEmpty()) {
            throw bad("Link is required");
        }
        if (url.length() > MAX_URL) {
            throw bad("Link cannot exceed " + MAX_URL + " characters");
        }
        String host = checkedHost(url);
        if (title.isEmpty()) {
            title = host;
        }
        if (title.length() > MAX_TITLE) {
            throw bad("Title cannot exceed " + MAX_TITLE + " characters");
        }
        if (linkRepository.countByTicketId(ticketId) >= MAX_LINKS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A question can have at most " + MAX_LINKS + " links");
        }

        TopicLink link = new TopicLink();
        link.setTicketId(ticketId);
        link.setAddedBy(actor.id());
        link.setTitle(title);
        link.setUrl(url);
        link.setKind(request.kind() == null ? LinkKind.LINK : request.kind());
        TopicLink saved = linkRepository.save(link);

        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actor.id());
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName("material");
        row.setToValue(title.length() > 200 ? title.substring(0, 200) : title);
        historyRepository.save(row);

        // the author hears about new material
        if (!actor.id().equals(ticket.getAuthorId())) {
            String who = userName(actor.id());
            String message = who + " added learning material to " + ticket.getTicketNo()
                    + " (" + ticket.getTitle() + "): " + title;
            notificationService.notifyUsers(List.of(ticket.getAuthorId()), NotificationType.TICKET_STATUS, ticketId,
                    message.length() > MAX_MESSAGE ? message.substring(0, MAX_MESSAGE) : message);
        }

        return toDto(saved, Map.of(actor.id(), userName(actor.id())), actor);
    }

    @Override
    @Transactional
    public void delete(Long ticketId, Long linkId, TicketActor actor) {
        Ticket ticket = findViewableTopic(ticketId, actor);
        TopicLink link = linkRepository.findByIdAndTicketId(linkId, ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found"));
        if (!actor.admin() && !actor.id().equals(link.getAddedBy())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This link belongs to someone else");
        }
        if (FINISHED.contains(ticket.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is finished. Links cannot be removed");
        }
        linkRepository.delete(link);
    }

    // ---------- helpers ----------

    private Ticket findViewableTopic(Long ticketId, TicketActor actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        if (ticket.getType() != TicketType.TOPIC_REQUEST) {
            throw bad("Learning material is only for topic requests");
        }
        return ticket;
    }

    // only http and https with a real host. no javascript:, no file:, no spaces
    private String checkedHost(String url) {
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw bad("Link must start with http:// or https://");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw bad("Link is not valid");
            }
            return uri.getHost();
        } catch (URISyntaxException e) {
            throw bad("Link is not valid");
        }
    }

    private Map<Long, String> userNames(List<TopicLink> rows) {
        Set<Long> ids = rows.stream().map(TopicLink::getAddedBy).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private TopicLinkDto toDto(TopicLink l, Map<Long, String> names, TicketActor actor) {
        boolean canDelete = actor.admin() || actor.id().equals(l.getAddedBy());
        return new TopicLinkDto(l.getId(), l.getTicketId(), l.getTitle(), l.getUrl(), l.getKind(),
                l.getAddedBy(), names.getOrDefault(l.getAddedBy(), "#" + l.getAddedBy()),
                l.getCreatedOn(), canDelete);
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}