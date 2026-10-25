package com.fixhub.notification.entity;

/**
 * What the notification is about. This list is the only check on the column, so
 * add a new kind here when a commit starts sending it.
 */
public enum NotificationType {
    // a new ticket was routed to your department
    TICKET_ROUTED
}