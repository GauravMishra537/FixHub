package com.fixhub.infra.service;

import com.fixhub.infra.dto.BoardDto;
import com.fixhub.ticket.service.TicketActor;

import java.time.Instant;

public interface BoardService {

    /** Every unit of one kind with the sessions that hold it between from and to (at most 8 days). */
    BoardDto board(Long infraTypeId, Instant from, Instant to, TicketActor actor);
}