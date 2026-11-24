package com.fixhub.topic.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketCategoryService;
import com.fixhub.ticket.service.TicketNumberService;
import com.fixhub.topic.dto.TopicRequestDto;
import com.fixhub.topic.dto.TopicRequestResultDto;
import com.fixhub.topic.entity.TopicRequestSkill;
import com.fixhub.topic.repository.TopicHelperRepository;
import com.fixhub.topic.repository.TopicRequestSkillRepository;
import com.fixhub.topic.repository.TopicSkillRepository;
import com.fixhub.topic.repository.TopicTicketCategoryRepository;
import com.fixhub.topic.service.TopicRequestService;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.Skill;
import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TopicRequestServiceImpl implements TopicRequestService {

    private static final int MAX_TITLE = 200;
    private static final int MAX_DESCRIPTION = 5000;
    private static final int MAX_TOPICS = 1;
    private static final int MAX_MESSAGE = 255;
    private static final int MAX_NOTE = 500;

    private final TopicSkillRepository skillRepository;
    private final TopicRequestSkillRepository topicRepository;
    private final TopicHelperRepository helperRepository;
    private final TopicTicketCategoryRepository ticketCategoryRepository;
    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketNumberService ticketNumberService;
    private final TicketCategoryService categoryService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TopicRequestServiceImpl(TopicSkillRepository skillRepository,
                                   TopicRequestSkillRepository topicRepository,
                                   TopicHelperRepository helperRepository,
                                   TopicTicketCategoryRepository ticketCategoryRepository,
                                   TicketRepository ticketRepository,
                                   TicketHistoryRepository historyRepository,
                                   TicketNumberService ticketNumberService,
                                   TicketCategoryService categoryService,
                                   UserRepository userRepository,
                                   NotificationService notificationService) {
        this.skillRepository = skillRepository;
        this.topicRepository = topicRepository;
        this.helperRepository = helperRepository;
        this.ticketCategoryRepository = ticketCategoryRepository;
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.ticketNumberService = ticketNumberService;
        this.categoryService = categoryService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public TopicRequestResultDto create(TopicRequestDto request, TicketActor actor) {
        if (request == null) {
            throw bad("Request details are required");
        }
        String title = clean(request.title());
        if (title.isEmpty()) {
            throw bad("Title is required");
        }
        if (title.length() > MAX_TITLE) {
            throw bad("Title cannot exceed " + MAX_TITLE + " characters");
        }
        String description = clean(request.description());
        if (description.isEmpty()) {
            throw bad("Describe your problem");
        }
        if (description.length() > MAX_DESCRIPTION) {
            throw bad("Description cannot exceed " + MAX_DESCRIPTION + " characters");
        }

        // 1 to 3 different topics, all from the accepted skill list
        List<Long> ids = request.skillIds() == null
                ? List.of()
                : request.skillIds().stream().filter(Objects::nonNull)
                        .collect(Collectors.toCollection(LinkedHashSet::new)).stream().toList();
        if (ids.isEmpty()) {
            throw bad("Pick a topic");
        }
        if (ids.size() > MAX_TOPICS) {
            throw bad("Pick only one topic");
        }
        Map<Long, Skill> found = skillRepository.findByIdIn(ids).stream()
                .filter(Skill::isActive)
                .collect(Collectors.toMap(Skill::getId, Function.identity()));
        if (found.size() != ids.size()) {
            throw bad("Pick topics from the list");
        }
        List<Skill> skills = ids.stream().map(found::get).toList();
        String topicNames = skills.stream().map(Skill::getName).collect(Collectors.joining(", "));

        Ticket ticket = new Ticket();
        ticket.setType(TicketType.TOPIC_REQUEST);
        ticket.setTicketNo(ticketNumberService.nextTicketNo());
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPriority(request.priority() == null ? TicketPriority.MEDIUM : request.priority());
        ticket.setVisibility(request.visibility() == null ? TicketVisibility.PRIVATE : request.visibility());
        ticket.setAuthorId(actor.id());
        // routed by skill, not by department, so it never shows in a department queue
        ticket.setDepartmentId(null);
        ticket.setAssigneeId(null);
        ticket.setCategoryId(categoryIdFor(skills.get(0).getName()));
        ticket = ticketRepository.saveAndFlush(ticket);

        final Long ticketId = ticket.getId();
        topicRepository.saveAll(ids.stream().map(id -> new TopicRequestSkill(ticketId, id)).toList());

        TicketHistory created = new TicketHistory();
        created.setTicketId(ticketId);
        created.setActorId(actor.id());
        created.setAction(HistoryAction.CREATED);
        created.setNote(cutTo("Asked for help with " + topicNames, MAX_NOTE));
        historyRepository.save(created);

        // everyone with a matching approved skill, not the author, not admins
        List<Long> helpers = helperRepository.findHelperIds(ids, actor.id(), SkillStatus.APPROVED, Role.USER);
        String who = userName(actor.id());
        if (!helpers.isEmpty()) {
            notificationService.notifyUsers(helpers, NotificationType.TOPIC_HELP_NEEDED, ticketId,
                    cutTo(who + " needs help with " + topicNames + ": " + title + " (" + ticket.getTicketNo() + ")",
                            MAX_MESSAGE));
        } else {
            // nobody holds the skill, so an admin picks a helper
            List<Long> admins = userRepository.findIdsByRole(Role.ADMIN).stream()
                    .filter(id -> !id.equals(actor.id()))
                    .toList();
            if (!admins.isEmpty()) {
                notificationService.notifyUsers(admins, NotificationType.TOPIC_HELP_NEEDED, ticketId,
                        cutTo("No one has the skill for " + topicNames + ". Please assign a helper to "
                                + ticket.getTicketNo() + " (" + title + ")", MAX_MESSAGE));
            }
        }

        return new TopicRequestResultDto(ticketId, ticket.getTicketNo(), ticket.getTitle(), ticket.getStatus(),
                helpers.size());
    }

    // the card chip shows the first topic. find it, or let the category service make it
    private Long categoryIdFor(String name) {
        return ticketCategoryRepository.findFirstByTicketTypeAndNameIgnoreCase(TicketType.TOPIC_REQUEST, name)
                .map(TicketCategory::getId)
                .orElseGet(() -> {
                    categoryService.findOrCreate(TicketType.TOPIC_REQUEST, name);
                    return ticketCategoryRepository
                            .findFirstByTicketTypeAndNameIgnoreCase(TicketType.TOPIC_REQUEST, name)
                            .map(TicketCategory::getId)
                            .orElse(null);
                });
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static String cutTo(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}