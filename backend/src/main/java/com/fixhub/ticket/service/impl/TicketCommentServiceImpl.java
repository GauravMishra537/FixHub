package com.fixhub.ticket.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.dto.CommentRequestDto;
import com.fixhub.ticket.dto.CommentResponseDto;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketComment;
import com.fixhub.ticket.repository.TicketCommentRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketCommentService;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TicketCommentServiceImpl implements TicketCommentService {

    private static final int MAX_BODY = 2000;
    private static final int PREVIEW = 80;
    private static final int MAX_MESSAGE = 255;

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TicketRules rules;

    public TicketCommentServiceImpl(TicketRepository ticketRepository,
                                    TicketCommentRepository commentRepository,
                                    UserRepository userRepository,
                                    NotificationService notificationService,
                                    TicketRules rules) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.rules = rules;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponseDto> list(Long ticketId, TicketActor actor) {
        findViewable(ticketId, actor);

        List<TicketComment> rows = commentRepository.findByTicketIdOrderByCreatedOnAscIdAsc(ticketId);
        Map<Long, String> names = userNames(rows);
        return rows.stream().map(c -> toDto(c, names, actor)).toList();
    }

    @Override
    @Transactional
    public CommentResponseDto add(Long ticketId, CommentRequestDto request, TicketActor actor) {
        Ticket ticket = findViewable(ticketId, actor);

        String body = request.getBody() == null ? "" : request.getBody().trim();
        if (body.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment cannot be empty");
        }
        if (body.length() > MAX_BODY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Comment cannot exceed " + MAX_BODY + " characters");
        }

        TicketComment comment = new TicketComment();
        comment.setTicketId(ticketId);
        comment.setAuthorId(actor.id());
        comment.setBody(body);
        TicketComment saved = commentRepository.save(comment);

        notifyParties(ticket, actor.id(), body);

        return toDto(saved, Map.of(actor.id(), userName(actor.id())), actor);
    }

    @Override
    @Transactional
    public void delete(Long ticketId, Long commentId, TicketActor actor) {
        findViewable(ticketId, actor);

        TicketComment comment = commentRepository.findByIdAndTicketId(commentId, ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (!actor.admin() && !actor.id().equals(comment.getAuthorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can delete only your own comments");
        }
        commentRepository.delete(comment);
    }

    // ---------- helpers ----------

    private Ticket findViewable(Long ticketId, TicketActor actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        return ticket;
    }

    // the requester and the assignee hear about it. not the person who wrote it
    private void notifyParties(Ticket ticket, Long writerId, String body) {
        List<Long> people = new ArrayList<>();
        if (ticket.getAuthorId() != null && !ticket.getAuthorId().equals(writerId)) {
            people.add(ticket.getAuthorId());
        }
        if (ticket.getAssigneeId() != null && !ticket.getAssigneeId().equals(writerId)
                && !people.contains(ticket.getAssigneeId())) {
            people.add(ticket.getAssigneeId());
        }
        if (people.isEmpty()) {
            return;
        }

        String preview = body.length() > PREVIEW ? body.substring(0, PREVIEW) + "..." : body;
        String message = userName(writerId) + " commented on " + ticket.getTicketNo() + ": " + preview;
        if (message.length() > MAX_MESSAGE) {
            message = message.substring(0, MAX_MESSAGE);
        }
        notificationService.notifyUsers(people, NotificationType.COMMENT_ADDED, ticket.getId(), message);
    }

    private Map<Long, String> userNames(List<TicketComment> rows) {
        Set<Long> ids = rows.stream().map(TicketComment::getAuthorId).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private CommentResponseDto toDto(TicketComment c, Map<Long, String> names, TicketActor actor) {
        boolean canDelete = actor.admin() || actor.id().equals(c.getAuthorId());
        return new CommentResponseDto(c.getId(), c.getTicketId(), c.getAuthorId(),
                names.getOrDefault(c.getAuthorId(), "#" + c.getAuthorId()),
                c.getBody(), c.getCreatedOn(), canDelete);
    }
}