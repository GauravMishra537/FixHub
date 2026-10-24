package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Full ticket for the details page. */
@Getter
@Setter
public class TicketResponseDto {

    private Long id;
    private String ticketNo;
    private TicketType type;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    private TicketVisibility visibility;

    private Long authorId;
    private String authorName;
    private Long assigneeId;
    private String assigneeName;

    private Long categoryId;
    private String categoryName;
    private Long departmentId;
    private String departmentName;

    private Instant resolvedOn;
    private Instant closedOn;
    private int reopenCount;
    private Long version;

    private Instant createdOn;
    private Instant updatedOn;

    // true when the viewer is the requester and the status still allows edits
    private boolean canEdit;

    // true when the viewer is an admin and the ticket is not finished: category and priority only
    private boolean canTriage;
}