package com.fixhub.topic.service.impl;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.topic.dto.TopicChipDto;
import com.fixhub.topic.dto.TopicQueueItemDto;
import com.fixhub.topic.dto.TopicSkillDto;
import com.fixhub.topic.entity.TopicRequestSkill;
import com.fixhub.topic.repository.TopicDeclineRepository;
import com.fixhub.topic.repository.TopicHelperRepository;
import com.fixhub.topic.repository.TopicRequestSkillRepository;
import com.fixhub.topic.repository.TopicSkillRepository;
import com.fixhub.topic.service.TopicReadService;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.Skill;
import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TopicReadServiceImpl implements TopicReadService {

    private static final int QUEUE_LIMIT = 50;

    private final TopicSkillRepository skillRepository;
    private final TopicHelperRepository helperRepository;
    private final TopicRequestSkillRepository topicRepository;
    private final TopicDeclineRepository declineRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TicketRules rules;

    public TopicReadServiceImpl(TopicSkillRepository skillRepository,
                                TopicHelperRepository helperRepository,
                                TopicRequestSkillRepository topicRepository,
                                TopicDeclineRepository declineRepository,
                                TicketRepository ticketRepository,
                                UserRepository userRepository,
                                TicketRules rules) {
        this.skillRepository = skillRepository;
        this.helperRepository = helperRepository;
        this.topicRepository = topicRepository;
        this.declineRepository = declineRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.rules = rules;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicSkillDto> skills(TicketActor actor) {
        // one small query per topic. the list of topics is short
        return skillRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(s -> new TopicSkillDto(s.getId(), s.getName(),
                        (int) helperRepository
                                .findHelperIds(List.of(s.getId()), actor.id(), SkillStatus.APPROVED, Role.USER)
                                .stream().distinct().count()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicChipDto> topicsOf(Long ticketId, TicketActor actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        if (ticket.getType() != TicketType.TOPIC_REQUEST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This is not a topic request");
        }

        List<Long> ids = topicRepository.findByTicketIdOrderByIdAsc(ticketId).stream()
                .map(TopicRequestSkill::getSkillId)
                .toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Skill> byId = skillRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Skill::getId, Function.identity(), (a, b) -> a));
        return ids.stream()
                .filter(byId::containsKey)
                .map(id -> new TopicChipDto(id, byId.get(id).getName()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicQueueItemDto> queue(TicketActor actor) {
        // admins assign. they do not pick work from this list
        if (actor.admin()) {
            return List.of();
        }
        List<Long> mine = helperRepository.findSkillIdsOfUser(actor.id(), SkillStatus.APPROVED);
        if (mine.isEmpty()) {
            return List.of();
        }

        List<Long> candidateIds = topicRepository.findTicketIdsBySkillIds(mine).stream().distinct().toList();
        if (candidateIds.isEmpty()) {
            return List.of();
        }

        List<Ticket> tickets = ticketRepository.findAllById(candidateIds).stream()
                .filter(t -> t.getType() == TicketType.TOPIC_REQUEST
                        && t.getStatus() == TicketStatus.OPEN
                        && t.getAssigneeId() == null
                        && !actor.id().equals(t.getAuthorId()))
                .filter(t -> !declineRepository.existsByTicketIdAndUserId(t.getId(), actor.id()))
                .sorted(Comparator.comparing(Ticket::getCreatedOn).thenComparing(Ticket::getId))
                .limit(QUEUE_LIMIT)
                .toList();
        if (tickets.isEmpty()) {
            return List.of();
        }

        // topic names of all these tickets, in 2 queries
        List<Long> ticketIds = tickets.stream().map(Ticket::getId).toList();
        List<TopicRequestSkill> links = topicRepository.findByTicketIdIn(ticketIds);
        Set<Long> skillIds = links.stream().map(TopicRequestSkill::getSkillId).collect(Collectors.toSet());
        Map<Long, String> skillNames = skillRepository.findByIdIn(skillIds).stream()
                .collect(Collectors.toMap(Skill::getId, Skill::getName, (a, b) -> a));
        Map<Long, List<String>> namesByTicket = new LinkedHashMap<>();
        for (TopicRequestSkill l : links) {
            String name = skillNames.get(l.getSkillId());
            if (name != null) {
                namesByTicket.computeIfAbsent(l.getTicketId(), k -> new java.util.ArrayList<>()).add(name);
            }
        }

        Set<Long> authorIds = new HashSet<>();
        tickets.forEach(t -> authorIds.add(t.getAuthorId()));
        Map<Long, String> authors = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));

        return tickets.stream()
                .map(t -> new TopicQueueItemDto(t.getId(), t.getTicketNo(), t.getTitle(), t.getPriority(),
                        t.getVisibility(), authors.getOrDefault(t.getAuthorId(), "Former user"),
                        namesByTicket.getOrDefault(t.getId(), List.of()), t.getCreatedOn()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long queueCount(TicketActor actor) {
        return queue(actor).size();
    }
}