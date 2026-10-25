package com.fixhub.ticket.service;

import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.AdminTicketHistoryDto;

import java.util.List;

public interface AdminTicketHistoryService {

    /** Newest first. action empty = every kind of event. */
    PageResponse<AdminTicketHistoryDto> list(String action, int page, int size);

    /** Names of all event kinds, for the filter. */
    List<String> actions();
}