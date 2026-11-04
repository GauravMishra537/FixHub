package com.fixhub.resource.entity;

/** Where one resource request stands. The ticket status follows it. */
public enum RequestStatus {
    // waiting for the department's responsible person
    PENDING_DEPT,
    // the department said yes, waiting for an admin
    PENDING_ADMIN,
    // an admin said yes. stays open until the author closes it
    APPROVED,
    REJECTED,
    CANCELLED,
    // the author confirmed the item arrived
    CLOSED
}