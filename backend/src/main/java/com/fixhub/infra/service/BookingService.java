package com.fixhub.infra.service;

import com.fixhub.infra.dto.BookingGroupDto;
import com.fixhub.infra.dto.BookingRequestDto;
import com.fixhub.infra.dto.BookingResponseDto;
import com.fixhub.ticket.service.TicketActor;

import java.util.List;

public interface BookingService {

    /** One ticket, many sessions. All or nothing. */
    BookingGroupDto create(BookingRequestDto request, TicketActor actor);

    /** The sessions of one ticket. Only the author and admins. */
    List<BookingResponseDto> getSessions(Long ticketId, TicketActor actor);

    /** Admin only. Cancel one session with a reason. The last one gone cancels the ticket. */
    BookingResponseDto cancelSession(Long bookingId, String note, TicketActor actor);
}