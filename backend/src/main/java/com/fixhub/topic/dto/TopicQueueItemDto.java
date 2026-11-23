package com.fixhub.topic.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;

import java.time.Instant;
import java.util.List;

/** One row of "Questions you can help with". */
public record TopicQueueItemDto(
        Long ticketId,
        String ticketNo,
        String title,
        TicketPriority priority,
        TicketVisibility visibility,
        String authorName,
        List<String> topics,
        Instant createdOn) {
}