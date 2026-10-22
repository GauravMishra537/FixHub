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

    // typing box: active categories whose name contains the text, best matches first, max 8
    List<TicketCategoryResponseDto> suggest(TicketType type, String text);

    // used when a ticket is raised: find by name, or create it. runs in its own transaction
    TicketCategoryResponseDto findOrCreate(TicketType type, String name);

    TicketCategoryResponseDto create(TicketCategoryRequestDto request);

    TicketCategoryResponseDto update(Long id, TicketCategoryRequestDto request);

    void delete(Long id);
}