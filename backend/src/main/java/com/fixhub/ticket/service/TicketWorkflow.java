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
 * Every allowed status move in one place, one table per ticket type:
 * from which status, to which status, and who may do it.
 * Issue and infra booking for now. Other types get their own table in their own commits.
 */
@Component
public class TicketWorkflow {

    private enum By { ASSIGNEE, REQUESTER, REQUESTER_OR_ADMIN, ADMIN }

    private record Rule(Set<TicketStatus> from, TicketStatus to, By by) {
    }

    private static final Map<TicketType, Map<WorkflowAction, Rule>> RULES = new EnumMap<>(TicketType.class);

    static {
        // ---------- issue ----------
        Map<WorkflowAction, Rule> issue = new EnumMap<>(WorkflowAction.class);

        // the person working on it
        issue.put(WorkflowAction.START,
                new Rule(Set.of(TicketStatus.ASSIGNED, TicketStatus.REOPENED), TicketStatus.IN_PROGRESS, By.ASSIGNEE));
        issue.put(WorkflowAction.HOLD,
                new Rule(Set.of(TicketStatus.IN_PROGRESS), TicketStatus.ON_HOLD, By.ASSIGNEE));
        issue.put(WorkflowAction.RESUME,
                new Rule(Set.of(TicketStatus.ON_HOLD), TicketStatus.IN_PROGRESS, By.ASSIGNEE));
        issue.put(WorkflowAction.RESOLVE,
                new Rule(Set.of(TicketStatus.IN_PROGRESS), TicketStatus.RESOLVED, By.ASSIGNEE));

        // the person who raised it. an admin may also close a resolved ticket
        issue.put(WorkflowAction.CONFIRM,
                new Rule(Set.of(TicketStatus.RESOLVED), TicketStatus.CLOSED, By.REQUESTER_OR_ADMIN));
        issue.put(WorkflowAction.REOPEN,
                new Rule(Set.of(TicketStatus.RESOLVED), TicketStatus.REOPENED, By.REQUESTER));
        issue.put(WorkflowAction.CANCEL,
                new Rule(Set.of(TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.ASSIGNED),
                        TicketStatus.CANCELLED, By.REQUESTER));
        RULES.put(TicketType.ISSUE, issue);

        // ---------- infra booking ----------
        // the whole group is approved or rejected together. closing after the last session is done by a job
        Map<WorkflowAction, Rule> infra = new EnumMap<>(WorkflowAction.class);
        infra.put(WorkflowAction.APPROVE,
                new Rule(Set.of(TicketStatus.PENDING_APPROVAL), TicketStatus.APPROVED, By.ADMIN));
        infra.put(WorkflowAction.REJECT,
                new Rule(Set.of(TicketStatus.PENDING_APPROVAL), TicketStatus.REJECTED, By.ADMIN));
        infra.put(WorkflowAction.CANCEL,
                new Rule(Set.of(TicketStatus.PENDING_APPROVAL, TicketStatus.APPROVED),
                        TicketStatus.CANCELLED, By.REQUESTER_OR_ADMIN));
        RULES.put(TicketType.INFRA_BOOKING, infra);
    }

    /** Does this ticket type have a workflow yet? */
    public boolean supports(TicketType type) {
        return RULES.containsKey(type);
    }

    /** The status the ticket gets after this action. Call only after deniedReason said null. */
    public TicketStatus targetStatus(TicketType type, WorkflowAction action) {
        return RULES.get(type).get(action).to();
    }

    /** null = allowed. Otherwise a message that is safe to show the user. */
    public String deniedReason(Ticket ticket, WorkflowAction action, Long userId, boolean admin) {
        Map<WorkflowAction, Rule> typeRules = RULES.get(ticket.getType());
        if (typeRules == null) {
            return "Status changes are not available for this ticket type yet";
        }
        Rule rule = typeRules.get(action);
        if (rule == null) {
            return "This action is not available for this ticket type";
        }

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
        if (rule.by() == By.ADMIN && !admin) {
            return "Only an admin can do this";
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