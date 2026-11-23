package com.fixhub.topic.dto;

import com.fixhub.ticket.entity.TicketStatus;

/** helperCount = how many people with a matching skill were asked. 0 means an admin was asked instead. */
public record TopicRequestResultDto(
        Long ticketId,
        String ticketNo,
        String title,
        TicketStatus status,
        int helperCount) {
}