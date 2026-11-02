package com.fixhub.infra.service;

import com.fixhub.infra.dto.BookingGroupDto;
import com.fixhub.infra.dto.BookingRequestDto;
import com.fixhub.infra.dto.BookingResponseDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.infra.dto.InfraSettingsDto;
import com.fixhub.infra.dto.InfraSettingsRequestDto;
import java.util.List;

public interface BookingService {

    /** One ticket, many sessions. All or nothing. */
    BookingGroupDto create(BookingRequestDto request, TicketActor actor);

    /** The sessions of one ticket. Only the author and admins. */
    List<BookingResponseDto> getSessions(Long ticketId, TicketActor actor);

    BookingResponseDto approveSession(Long bookingId, TicketActor actor);

     BookingResponseDto rejectSession(Long bookingId, String note, TicketActor actor);

    InfraSettingsDto updateSettings(Long ticketId, InfraSettingsRequestDto request, TicketActor actor);
}