package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.TicketCategoryRequestDto;
import com.fixhub.ticket.dto.TicketCategoryResponseDto;
import com.fixhub.ticket.entity.TicketType;

import java.util.List;

public interface TicketCategoryService {

    // admin: all categories, optionally one type (null = all)
    List<TicketCategoryResponseDto> getAll(TicketType type);

    // any logged in user: active categories of one type
    List<TicketCategoryResponseDto> getActiveByType(TicketType type);

    TicketCategoryResponseDto create(TicketCategoryRequestDto request);

    TicketCategoryResponseDto update(Long id, TicketCategoryRequestDto request);

    void delete(Long id);
}