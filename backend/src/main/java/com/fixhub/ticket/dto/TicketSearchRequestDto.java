package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Query parameters of the ticket list. Every filter is optional.
 * Example: /api/tickets?q=wifi&status=NEW&status=OPEN&priority=URGENT&sortBy=createdOn&direction=desc
 */
@Getter
@Setter
public class TicketSearchRequestDto {

    /** Sort fields the list may use. Anything else is rejected, so no raw column names reach the query. */
    public static final Set<String> SORT_FIELDS =
            Set.of("createdOn", "updatedOn", "ticketNo", "title", "status", "priority");

    // search text: matches title or ticket number
    @Size(max = 100, message = "Search text cannot exceed 100 characters")
    private String q;

    private TicketType type;

    // can repeat: status=NEW&status=OPEN
    private List<TicketStatus> status;

    private Long categoryId;

    private TicketPriority priority;

    private Long departmentId;

    // admin and handlers use it. a normal user can send it too, visibility rule still applies
    private Long assigneeId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate createdFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate createdTo;

    // true: only tickets this user raised
    private Boolean mineOnly;

    // PENDING or RESOLVED. empty means every status
    @Pattern(regexp = "(?i)^(PENDING|RESOLVED)?$", message = "Group must be PENDING or RESOLVED")
    private String group;

    @Pattern(regexp = "^(createdOn|updatedOn|ticketNo|title|status|priority)$",
            message = "Cannot sort by this field")
    private String sortBy = "createdOn";

    @Pattern(regexp = "(?i)^(asc|desc)$", message = "Direction must be asc or desc")
    private String direction = "desc";

    @Min(value = 0, message = "Page cannot be negative")
    private int page = 0;

    @Min(value = 1, message = "Size must be at least 1")
    @Max(value = 50, message = "Size cannot exceed 50")
    private int size = 10;

    @AssertTrue(message = "'From' date cannot be after 'To' date")
    public boolean isDateRangeValid() {
        return createdFrom == null || createdTo == null || !createdFrom.isAfter(createdTo);
    }

    // ---- helpers the service and filter builder use ----

    /** Trimmed search text, or null when empty. */
    public String searchText() {
        if (q == null) {
            return null;
        }
        String t = q.trim();
        return t.isEmpty() ? null : t;
    }

    /** Group in upper case, or null when empty. */
    public String groupName() {
        if (group == null || group.isBlank()) {
            return null;
        }
        return group.trim().toUpperCase(Locale.ROOT);
    }

    public boolean ascending() {
        return "asc".equalsIgnoreCase(direction);
    }
}