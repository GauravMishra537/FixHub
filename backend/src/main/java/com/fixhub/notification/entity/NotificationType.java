package com.fixhub.notification.entity;

/**
 * What the notification is about. This list is the only check on the column, so
 * add a new kind here when a commit starts sending it.
 */
public enum NotificationType {
    // a new ticket was routed to your department
    TICKET_ROUTED,
    // an employee asks to take a ticket that needs approval (to admins)
    CLAIM_REQUESTED,
    // your claim was approved or rejected
    CLAIM_APPROVED,
    CLAIM_REJECTED,
    // a ticket was given to you, or taken from you
    TICKET_ASSIGNED,
    TICKET_UNASSIGNED,
    // your ticket now has a person working on it (to the author)
    TICKET_TAKEN,
    TICKET_STATUS,
    TICKET_RESOLVED,
    TICKET_CLOSED,
    TICKET_REOPENED,
    TICKET_CANCELLED,
    COMMENT_ADDED,
    // infra booking: a request waits for an admin (to admins), your booking was decided or cancelled
    BOOKING_REQUESTED,
    BOOKING_APPROVED,
    BOOKING_REJECTED,
    BOOKING_CANCELLED

}