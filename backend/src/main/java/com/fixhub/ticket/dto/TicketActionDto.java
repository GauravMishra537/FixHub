package com.fixhub.ticket.dto;

/** One button the details page may show: what it does, its text, and whether a reason is needed. */
public record TicketActionDto(String action, String label, boolean noteRequired) {
}