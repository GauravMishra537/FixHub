package com.fixhub.ticket.repository;

import com.fixhub.ticket.dto.TicketSearchRequestDto;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketVisibility;
import com.fixhub.ticket.service.TicketActor;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

/** Builds the ticket list query from the search request. Every filter is added only when given. */
public final class TicketSpecifications {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private TicketSpecifications() {
    }

    /**
     * @param groupStatuses statuses for group=PENDING or RESOLVED. The service picks the right set.
     *                      Ignored when the request has no group.
     */
    public static Specification<Ticket> build(TicketSearchRequestDto req,
                                              TicketActor actor,
                                              Collection<TicketStatus> groupStatuses) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();

            // 1. who may see the ticket. Same rule as the dashboard. Admin sees all.
            if (!actor.admin()) {
                p.add(cb.or(
                        cb.equal(root.get("visibility"), TicketVisibility.PUBLIC),
                        cb.equal(root.get("authorId"), actor.id()),
                        cb.equal(root.get("assigneeId"), actor.id())));
            }

            // 2. search text: title or ticket number, case-insensitive, % _ \ match literally
            String text = req.searchText();
            if (text != null) {
                String escaped = text.toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_");
                String pattern = "%" + escaped + "%";
                p.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern, '\\'),
                        cb.like(cb.lower(root.get("ticketNo")), pattern, '\\')));
            }

            // 3. plain filters
            if (req.getType() != null) {
                p.add(cb.equal(root.get("type"), req.getType()));
            }
            if (req.getStatus() != null && !req.getStatus().isEmpty()) {
                p.add(root.get("status").in(req.getStatus()));
            }
            if (req.groupName() != null && groupStatuses != null) {
                p.add(root.get("status").in(groupStatuses));
            }
            if (req.getCategoryId() != null) {
                p.add(cb.equal(root.get("categoryId"), req.getCategoryId()));
            }
            if (req.getPriority() != null) {
                p.add(cb.equal(root.get("priority"), req.getPriority()));
            }
            if (req.getDepartmentId() != null) {
                p.add(cb.equal(root.get("departmentId"), req.getDepartmentId()));
            }
            if (req.getAssigneeId() != null) {
                p.add(cb.equal(root.get("assigneeId"), req.getAssigneeId()));
            }
            if (Boolean.TRUE.equals(req.getMineOnly())) {
                p.add(cb.equal(root.get("authorId"), actor.id()));
            }
            if (Boolean.TRUE.equals(req.getAssignedToMe())) {
                p.add(cb.equal(root.get("assigneeId"), actor.id()));
            }
            if (Boolean.TRUE.equals(req.getInvolvedOnly())) {
                p.add(cb.or(
                        cb.equal(root.get("authorId"), actor.id()),
                        cb.equal(root.get("assigneeId"), actor.id())));
            }

            // 4. created date range. 'To' day is included, so it ends at the start of the next day
            if (req.getCreatedFrom() != null) {
                Instant from = req.getCreatedFrom().atStartOfDay(ZONE).toInstant();
                p.add(cb.greaterThanOrEqualTo(root.get("createdOn"), from));
            }
            if (req.getCreatedTo() != null) {
                Instant to = req.getCreatedTo().plusDays(1).atStartOfDay(ZONE).toInstant();
                p.add(cb.lessThan(root.get("createdOn"), to));
            }

            // 5. priority sorts by real severity, not alphabetically.
            // normal fields sort through Pageable. The count query must not get an order by.
            boolean countQuery = Long.class.equals(query.getResultType())
                    || long.class.equals(query.getResultType());
            if ("priority".equals(req.getSortBy()) && !countQuery) {
                Expression<Integer> rank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("priority"), TicketPriority.LOW), 1)
                        .when(cb.equal(root.get("priority"), TicketPriority.MEDIUM), 2)
                        .when(cb.equal(root.get("priority"), TicketPriority.HIGH), 3)
                        .when(cb.equal(root.get("priority"), TicketPriority.URGENT), 4)
                        .otherwise(0);
                query.orderBy(
                        req.ascending() ? cb.asc(rank) : cb.desc(rank),
                        cb.desc(root.get("createdOn")),
                        cb.desc(root.get("id")));
            }

            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    /** Page and sort. Priority carries no Sort here, build() orders it by severity instead. */
    public static Pageable pageable(TicketSearchRequestDto req) {
        if ("priority".equals(req.getSortBy())) {
            return PageRequest.of(req.getPage(), req.getSize());
        }
        Sort.Direction direction = req.ascending() ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, req.getSortBy()).and(Sort.by(Sort.Direction.DESC, "id"));
        return PageRequest.of(req.getPage(), req.getSize(), sort);
    }
}