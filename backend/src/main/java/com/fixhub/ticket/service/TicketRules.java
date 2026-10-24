package com.fixhub.ticket.service;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

/**
 * All ticket permission and status rules in one place.
 * Commit 13 turns on ISSUE only. Other types are listed so their rows are ready,
 * but they stay off in CREATABLE_TYPES until their own commit.
 */
@Component
public class TicketRules {

    // types users may create right now
    private static final Set<TicketType> CREATABLE_TYPES = Set.of(TicketType.ISSUE);

    // types that need a category (the user types its name)
    private static final Set<TicketType> CATEGORY_TYPES = Set.of(TicketType.ISSUE);

    // status a new ticket starts with
    private static final Map<TicketType, TicketStatus> INITIAL_STATUS = new EnumMap<>(TicketType.class);

    // statuses in which the requester may still edit the content
    private static final Map<TicketType, Set<TicketStatus>> EDITABLE = new EnumMap<>(TicketType.class);

    // dashboard groups
    private static final Set<TicketStatus> PENDING = Set.of(
            TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS,
            TicketStatus.ON_HOLD, TicketStatus.REOPENED, TicketStatus.PENDING_APPROVAL,
            TicketStatus.APPROVED, TicketStatus.ISSUED, TicketStatus.ACCEPTED);

    private static final Set<TicketStatus> RESOLVED = Set.of(
            TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.RETURNED);

    // finished tickets: nobody changes them any more
    private static final Set<TicketStatus> FINISHED = Set.of(
            TicketStatus.CLOSED, TicketStatus.CANCELLED, TicketStatus.REJECTED, TicketStatus.RETURNED);

    static {
        INITIAL_STATUS.put(TicketType.ISSUE, TicketStatus.NEW);
        INITIAL_STATUS.put(TicketType.ROOM_BOOKING, TicketStatus.PENDING_APPROVAL);
        INITIAL_STATUS.put(TicketType.RESOURCE_REQUEST, TicketStatus.PENDING_APPROVAL);
        INITIAL_STATUS.put(TicketType.TOPIC_REQUEST, TicketStatus.OPEN);

        EDITABLE.put(TicketType.ISSUE,
                Set.of(TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.ASSIGNED));
        EDITABLE.put(TicketType.ROOM_BOOKING, Set.of(TicketStatus.PENDING_APPROVAL));
        EDITABLE.put(TicketType.RESOURCE_REQUEST, Set.of(TicketStatus.PENDING_APPROVAL));
        EDITABLE.put(TicketType.TOPIC_REQUEST, Set.of(TicketStatus.OPEN));
    }

    // ---------- create ----------

    public boolean isCreatable(TicketType type) {
        return CREATABLE_TYPES.contains(type);
    }

    public boolean needsCategory(TicketType type) {
        return CATEGORY_TYPES.contains(type);
    }

    public TicketStatus initialStatus(TicketType type) {
        return INITIAL_STATUS.get(type);
    }

    // ---------- view ----------

    /** Public: every logged in user. Private: requester, assignee, admin. */
    public boolean canView(Ticket ticket, Long viewerId, boolean admin) {
        if (ticket.getVisibility() == TicketVisibility.PUBLIC || admin) {
            return true;
        }
        return viewerId != null
                && (viewerId.equals(ticket.getAuthorId()) || viewerId.equals(ticket.getAssigneeId()));
    }

    // ---------- edit ----------

    /** Only the requester, only while the status allows it. */
    public boolean canEdit(Ticket ticket, Long viewerId) {
        return editDeniedReason(ticket, viewerId) == null;
    }

    /** null = allowed. Otherwise a message that is safe to show the user. */
    public String editDeniedReason(Ticket ticket, Long viewerId) {
        if (viewerId == null || !viewerId.equals(ticket.getAuthorId())) {
            return "Only the person who raised this ticket can edit it";
        }
        Set<TicketStatus> allowed = EDITABLE.getOrDefault(ticket.getType(), Set.of());
        if (!allowed.contains(ticket.getStatus())) {
            return "This ticket can no longer be edited because its status is "
                    + ticket.getStatus();
        }
        return null;
    }

    // ---------- admin triage ----------

    /** An admin may change category and priority of any ticket that is not finished. */
    public boolean canTriage(Ticket ticket, boolean admin) {
        return admin && !FINISHED.contains(ticket.getStatus());
    }

    // ---------- dashboard groups ----------

    public Set<TicketStatus> pendingStatuses() {
        return PENDING;
    }

    public Set<TicketStatus> resolvedStatuses() {
        return RESOLVED;
    }
}