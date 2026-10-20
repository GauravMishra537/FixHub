package com.fixhub.ticket.mapper;

import com.fixhub.ticket.dto.TicketCategoryResponseDto;
import com.fixhub.ticket.entity.TicketCategory;
import org.springframework.stereotype.Component;

@Component
public class TicketCategoryMapper {

    public TicketCategoryResponseDto toDto(TicketCategory category) {
        if (category == null) {
            return null;
        }
        TicketCategoryResponseDto dto = new TicketCategoryResponseDto();
        dto.setId(category.getId());
        dto.setTicketType(category.getTicketType());
        dto.setName(category.getName());
        dto.setActive(category.isActive());
        return dto;
    }
}