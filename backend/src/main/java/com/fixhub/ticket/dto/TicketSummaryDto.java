package com.fixhub.ticket.dto;

/** Numbers for the four dashboard cards. */
public record TicketSummaryDto(
        long totalVisible,
        long mine,
        long minePending,
        long mineResolved) {
}