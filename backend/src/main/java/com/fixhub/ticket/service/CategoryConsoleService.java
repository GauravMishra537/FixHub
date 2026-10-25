package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.CategoryConsoleDto;
import com.fixhub.ticket.entity.TicketType;

import java.util.List;

public interface CategoryConsoleService {

    /** Every category of one type (null = all) with how many tickets use it. */
    List<CategoryConsoleDto> list(TicketType type);

    CategoryConsoleDto rename(Long id, String name);

    /** Disabled category stays on old tickets but is hidden from suggestions. */
    CategoryConsoleDto setActive(Long id, boolean active);

    /** Move all tickets and routing rules of source into target, then remove source. */
    CategoryConsoleDto merge(Long sourceId, Long targetId);
}