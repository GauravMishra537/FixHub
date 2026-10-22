package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.HistoryAction;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** One timeline row on the details page. */
@Getter
@Setter
public class TicketHistoryResponseDto {

    private Long id;
    private HistoryAction action;
    private String fieldName;
    private String fromValue;
    private String toValue;
    private String note;

    private Long actorId;
    private String actorName;

    private Instant createdOn;
}