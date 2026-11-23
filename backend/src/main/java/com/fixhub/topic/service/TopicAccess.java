package com.fixhub.topic.service;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.topic.entity.TopicRequestSkill;
import com.fixhub.topic.repository.TopicDeclineRepository;
import com.fixhub.topic.repository.TopicHelperRepository;
import com.fixhub.topic.repository.TopicRequestSkillRepository;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.SkillStatus;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Skill rules for topic tickets. Read only, no ticket services inside,
 * so TicketRules can use it without a bean cycle.
 */
@Component
public class TopicAccess {

    private final TopicRequestSkillRepository topicRepository;
    private final TopicHelperRepository helperRepository;
    private final TopicDeclineRepository declineRepository;

    public TopicAccess(TopicRequestSkillRepository topicRepository,
                       TopicHelperRepository helperRepository,
                       TopicDeclineRepository declineRepository) {
        this.topicRepository = topicRepository;
        this.helperRepository = helperRepository;
        this.declineRepository = declineRepository;
    }

    // the topics (skill ids) of this ticket
    public Set<Long> skillIds(Long ticketId) {
        return topicRepository.findByTicketIdOrderByIdAsc(ticketId).stream()
                .map(TopicRequestSkill::getSkillId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    // normal users with a matching approved skill. never the author, never admins
    public List<Long> helperIds(Ticket ticket) {
        Set<Long> skills = skillIds(ticket.getId());
        if (skills.isEmpty()) {
            return List.of();
        }
        return helperRepository.findHelperIds(List.copyOf(skills), ticket.getAuthorId(),
                SkillStatus.APPROVED, Role.USER);
    }

    // true when this user holds an approved skill that matches one of the topics
    public boolean isSkilled(Ticket ticket, Long userId) {
        if (userId == null) {
            return false;
        }
        Set<Long> need = skillIds(ticket.getId());
        return helperRepository.findSkillIdsOfUser(userId, SkillStatus.APPROVED).stream()
                .anyMatch(need::contains);
    }

    // a skilled user (or one who said "I'm busy") may see a private topic ticket only while it waits for a helper
    public boolean seesInQueue(Ticket ticket, Long userId) {
        return ticket.getType() == TicketType.TOPIC_REQUEST
                && ticket.getStatus() == TicketStatus.OPEN
                && ticket.getAssigneeId() == null
                && !userId.equals(ticket.getAuthorId())
                && (isSkilled(ticket, userId)
                    || declineRepository.existsByTicketIdAndUserId(ticket.getId(), userId));
    }

    // null = this user may click "I can help"
    public String helperDeniedReason(Ticket ticket, Long userId) {
        if (declineRepository.existsByTicketIdAndUserId(ticket.getId(), userId)) {
            return "You said you were busy on this question";
        }
        if (!isSkilled(ticket, userId)) {
            return "You do not have a matching skill for this question";
        }
        return null;
    }

    // null = the admin may give the ticket to this user.
    // nobody holds the skill = any user (except the author) is allowed
    public String assignDeniedReason(Ticket ticket, Long userId) {
        if (ticket.getType() != TicketType.TOPIC_REQUEST) {
            return null;
        }
        if (userId.equals(ticket.getAuthorId())) {
            return "The author cannot be the helper";
        }
        List<Long> helpers = helperIds(ticket);
        if (!helpers.isEmpty() && !helpers.contains(userId)) {
            return "Pick a person who has this skill";
        }
        return null;
    }
}