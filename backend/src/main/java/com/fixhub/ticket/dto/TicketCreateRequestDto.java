package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketCreateRequestDto {

    @NotNull(message = "Ticket type is required")
    private TicketType type;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    private String description;

    // typed by the user. found by name, or created. required for ISSUE (checked in service)
    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String categoryName;

    // optional, default MEDIUM
    private TicketPriority priority;

    // optional, default PUBLIC
    private TicketVisibility visibility;

    // the requester asks for an admin to approve the ticket before work starts
    private Boolean requiresApproval;
}