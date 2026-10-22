package com.fixhub.ticket.dto;

/** One category with the number of tickets the caller may see in it. */
public record TicketCategoryCountDto(Long categoryId, String name, long count) {
}