package com.fixhub.topic.service;

import com.fixhub.ticket.service.TicketActor;
import com.fixhub.topic.dto.TopicRequestDto;
import com.fixhub.topic.dto.TopicRequestResultDto;

public interface TopicRequestService {

    // one ticket for one problem, about 1 to 3 topics. people with a matching skill are asked to help
    TopicRequestResultDto create(TopicRequestDto request, TicketActor actor);
}