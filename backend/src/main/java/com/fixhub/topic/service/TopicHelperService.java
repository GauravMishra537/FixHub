package com.fixhub.topic.service;

import com.fixhub.ticket.service.TicketActor;
import com.fixhub.topic.dto.TopicHelpersDto;

public interface TopicHelperService {

    // admin only: who can be assigned. skilled users, or everyone when nobody has the skill
    TopicHelpersDto candidates(Long ticketId, TicketActor actor);
}