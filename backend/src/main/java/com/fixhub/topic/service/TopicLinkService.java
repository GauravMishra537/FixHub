package com.fixhub.topic.service;

import com.fixhub.ticket.service.TicketActor;
import com.fixhub.topic.dto.TopicLinkDto;
import com.fixhub.topic.dto.TopicLinkRequestDto;

import java.util.List;

public interface TopicLinkService {

    // anyone who can view the ticket
    List<TopicLinkDto> list(Long ticketId, TicketActor actor);

    // the helper (assignee) or an admin
    TopicLinkDto add(Long ticketId, TopicLinkRequestDto request, TicketActor actor);

    // the person who added it, or an admin
    void delete(Long ticketId, Long linkId, TicketActor actor);
}