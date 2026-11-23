package com.fixhub.topic.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

import java.util.List;

/** The form: topics (skill ids, 1 to 3), a title, and the problem in the description. */
public record TopicRequestDto(
        String title,
        String description,
        List<Long> skillIds,
        TicketPriority priority,
        TicketVisibility visibility) {
}