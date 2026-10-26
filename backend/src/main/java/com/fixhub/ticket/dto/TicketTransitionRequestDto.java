package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.WorkflowAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketTransitionRequestDto {

    @NotNull(message = "Action is required")
    private WorkflowAction action;

    // reason or note. required for hold, resolve and reopen
    @Size(max = 500, message = "Note cannot exceed 500 characters")
    private String note;

    // the version the page was showing. a changed ticket returns a conflict
    @NotNull(message = "Version is required")
    private Long version;
}