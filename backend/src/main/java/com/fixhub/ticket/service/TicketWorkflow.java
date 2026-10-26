package com.fixhub.ticket.service;

import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.WorkflowAction;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Every allowed status move in one place: from which status, to which status, and who may do it.
 * Issue tickets only for now. Other types get their own rows in their own commits.
 */
@Component
public class TicketWorkflow {

    private enum By { ASSIGNEE, REQUESTER, REQUESTER_OR_ADMIN }

    private record Rule(Set<TicketStatus> from, TicketStatus to, By by) {
    }

    private static final Map<WorkflowAction, Rule> ISSUE = new EnumMap<>(WorkflowAction.class);

    static {
        // the person working on it
        ISSUE.put(WorkflowAction.START,
                new Rule(Set.of(TicketStatus.ASSIGNED, TicketStatus.REOPENED), TicketStatus.IN_PROGRESS, By.ASSIGNEE));
        ISSUE.put(WorkflowAction.HOLD,
                new Rule(Set.of(TicketStatus.IN_PROGRESS), TicketStatus.ON_HOLD, By.ASSIGNEE));
        ISSUE.put(WorkflowAction.RESUME,
                new Rule(Set.of(TicketStatus.ON_HOLD), TicketStatus.IN_PROGRESS, By.ASSIGNEE));
        ISSUE.put(WorkflowAction.RESOLVE,
                new Rule(Set.of(TicketStatus.IN_PROGRESS), TicketStatus.RESOLVED, By.ASSIGNEE));

        // the person who raised it. an admin may also close a resolved ticket
        ISSUE.put(WorkflowAction.CONFIRM,
                new Rule(Set.of(TicketStatus.RESOLVED), TicketStatus.CLOSED, By.REQUESTER_OR_ADMIN));
        ISSUE.put(WorkflowAction.REOPEN,
                new Rule(Set.of(TicketStatus.RESOLVED), TicketStatus.REOPENED, By.REQUESTER));
        ISSUE.put(WorkflowAction.CANCEL,
                new Rule(Set.of(TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.ASSIGNED),
                        TicketStatus.CANCELLED, By.REQUESTER));
    }

    /** Does this ticket type have a workflow yet? */
    public boolean supports(TicketType type) {
        return type == TicketType.ISSUE;
    }

    /** The status the ticket gets after this action. */
    public TicketStatus targetStatus(WorkflowAction action) {
        return ISSUE.get(action).to();
    }

    /** null = allowed. Otherwise a message that is safe to show the user. */
    public String deniedReason(Ticket ticket, WorkflowAction action, Long userId, boolean admin) {
        if (!supports(ticket.getType())) {
            return "Status changes are not available for this ticket type yet";
        }
        Rule rule = ISSUE.get(action);

        boolean isAssignee = userId != null && userId.equals(ticket.getAssigneeId());
        boolean isRequester = userId != null && userId.equals(ticket.getAuthorId());
        if (rule.by() == By.ASSIGNEE && !isAssignee) {
            return "Only the person assigned to this ticket can do this";
        }
        if (rule.by() == By.REQUESTER && !isRequester) {
            return "Only the person who raised this ticket can do this";
        }
        if (rule.by() == By.REQUESTER_OR_ADMIN && !isRequester && !admin) {
            return "Only the person who raised this ticket or an admin can do this";
        }

        if (!rule.from().contains(ticket.getStatus())) {
            return "You cannot do this while the ticket is " + ticket.getStatus();
        }
        return null;
    }

    /** Actions this person may do right now. The details page draws one button for each. */
    public List<WorkflowAction> allowedActions(Ticket ticket, Long userId, boolean admin) {
        return Arrays.stream(WorkflowAction.values())
                .filter(a -> deniedReason(ticket, a, userId, admin) == null)
                .toList();
    }
}