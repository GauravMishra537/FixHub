package com.fixhub.ticket.entity;

public enum ClaimStatus {
    // waits for an admin (the ticket has the approval tick)
    PENDING,
    // the employee got the ticket
    APPROVED,
    // the admin said no, or chose another employee
    REJECTED,
    // the employee took the claim back
    WITHDRAWN
}