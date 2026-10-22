package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Requester edit. Sends every editable field. Type and status cannot be changed here. */
@Getter
@Setter
public class TicketUpdateRequestDto {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    private String description;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String categoryName;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @NotNull(message = "Visibility is required")
    private TicketVisibility visibility;

    // version the user was looking at. different from DB version means someone else edited first
    @NotNull(message = "Version is required")
    private Long version;
}