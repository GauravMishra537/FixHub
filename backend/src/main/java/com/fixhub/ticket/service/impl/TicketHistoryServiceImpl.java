package com.fixhub.ticket.service.impl;

import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.service.TicketHistoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
public class TicketHistoryServiceImpl implements TicketHistoryService {

    private static final int FIELD_MAX = 50;
    private static final int NOTE_MAX = 500;

    private final TicketHistoryRepository historyRepository;

    public TicketHistoryServiceImpl(TicketHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    // joins the caller's transaction, so history and ticket save or fail together
    @Override
    @Transactional
    public void record(Long ticketId, Long actorId, HistoryAction action,
                       String fieldName, String fromValue, String toValue, String note) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actorId);
        row.setAction(action);
        row.setFieldName(cut(fieldName, FIELD_MAX));
        row.setFromValue(fromValue);
        row.setToValue(toValue);
        row.setNote(cut(note, NOTE_MAX));
        historyRepository.save(row);
    }

    @Override
    @Transactional
    public void recordCreated(Long ticketId, Long actorId) {
        record(ticketId, actorId, HistoryAction.CREATED, null, null, null, null);
    }

    @Override
    @Transactional
    public void recordFieldChange(Long ticketId, Long actorId, String fieldName,
                                  String fromValue, String toValue) {
        if (Objects.equals(fromValue, toValue)) {
            return;
        }
        record(ticketId, actorId, HistoryAction.UPDATED, fieldName, fromValue, toValue, null);
    }

    @Override
    @Transactional
    public void recordStatusChange(Long ticketId, Long actorId, String fromStatus,
                                   String toStatus, String note) {
        record(ticketId, actorId, HistoryAction.STATUS_CHANGED, "status", fromStatus, toStatus, note);
    }

    private String cut(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }
}