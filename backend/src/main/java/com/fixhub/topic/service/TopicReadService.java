package com.fixhub.topic.service;

import com.fixhub.ticket.service.TicketActor;
import com.fixhub.topic.dto.TopicChipDto;
import com.fixhub.topic.dto.TopicQueueItemDto;
import com.fixhub.topic.dto.TopicSkillDto;

import java.util.List;

public interface TopicReadService {

    // active topics for the form, each with how many others can help
    List<TopicSkillDto> skills(TicketActor actor);

    // topics of one ticket. the caller must be able to view it
    List<TopicChipDto> topicsOf(Long ticketId, TicketActor actor);

    // questions this user can help with, oldest first
    List<TopicQueueItemDto> queue(TicketActor actor);

    long queueCount(TicketActor actor);
}