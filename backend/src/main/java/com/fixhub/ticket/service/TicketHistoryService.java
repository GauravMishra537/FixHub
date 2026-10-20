package com.fixhub.ticket.service;

import com.fixhub.ticket.entity.HistoryAction;

/** Writes the ticket timeline. Rows are only ever added, never changed. */
public interface TicketHistoryService {

    void record(Long ticketId, Long actorId, HistoryAction action,
                String fieldName, String fromValue, String toValue, String note);

    void recordCreated(Long ticketId, Long actorId);

    /** One row per changed field. Does nothing when old and new value are equal. */
    void recordFieldChange(Long ticketId, Long actorId, String fieldName, String fromValue, String toValue);

    void recordStatusChange(Long ticketId, Long actorId, String fromStatus, String toStatus, String note);
}