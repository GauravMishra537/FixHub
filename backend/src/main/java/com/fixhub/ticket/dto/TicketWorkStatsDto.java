package com.fixhub.ticket.dto;

/** Numbers for the employee's own work. averageHours is null until the first resolve. */
public record TicketWorkStatsDto(
        long assignedNow,
        long resolvedTotal,
        long resolvedThisMonth,
        Double averageHours) {
}