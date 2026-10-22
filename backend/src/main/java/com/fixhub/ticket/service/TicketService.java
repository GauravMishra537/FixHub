package com.fixhub.ticket.service;

import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.TicketCreateRequestDto;
import com.fixhub.ticket.dto.TicketHistoryResponseDto;
import com.fixhub.ticket.dto.TicketListItemDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketSummaryDto;
import com.fixhub.ticket.dto.TicketUpdateRequestDto;

import java.util.List;

public interface TicketService {

    TicketResponseDto create(TicketCreateRequestDto request, TicketActor actor);

    TicketResponseDto get(Long id, TicketActor actor);

    // all tickets this user may see, newest first
    PageResponse<TicketListItemDto> listVisible(TicketActor actor, int page, int size);

    // tickets raised by this user. group = PENDING, RESOLVED or empty for all of mine
    PageResponse<TicketListItemDto> listMine(TicketActor actor, String group, int page, int size);

    TicketSummaryDto summary(TicketActor actor);

    TicketResponseDto update(Long id, TicketUpdateRequestDto request, TicketActor actor);

    List<TicketHistoryResponseDto> history(Long id, TicketActor actor);
}