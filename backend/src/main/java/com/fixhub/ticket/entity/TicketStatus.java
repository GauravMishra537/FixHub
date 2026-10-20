package com.fixhub.ticket.entity;

/**
 * Superset of all statuses. Which ones are allowed for which ticket type
 * and which move to which is checked in code (Commit 16).
 */
public enum TicketStatus {
    NEW,
    OPEN,
    ASSIGNED,
    IN_PROGRESS,
    ON_HOLD,
    RESOLVED,
    REOPENED,
    CLOSED,
    CANCELLED,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    ISSUED,
    RETURNED,
    ACCEPTED
}