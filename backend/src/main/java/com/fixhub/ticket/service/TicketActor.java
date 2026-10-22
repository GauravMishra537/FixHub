package com.fixhub.ticket.service;

/** Who is calling: user id and whether the user is an admin. Built in the controller. */
public record TicketActor(Long id, boolean admin) {
}