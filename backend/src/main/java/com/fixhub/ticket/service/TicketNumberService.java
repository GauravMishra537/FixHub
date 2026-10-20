package com.fixhub.ticket.service;

public interface TicketNumberService {

    /** Next ticket number, format FH-000001. Call inside the transaction that creates the ticket. */
    String nextTicketNo();
}