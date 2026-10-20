package com.fixhub.ticket.entity;

import com.fixhub.common.audit.entity.AuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "ticket")
@SQLDelete(sql = "UPDATE ticket SET deleted_on = now(), updated_on = now() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_on IS NULL")
public class Ticket extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_no", nullable = false, length = 20, updatable = false)
    private String ticketNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private TicketType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status = TicketStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketVisibility visibility = TicketVisibility.PRIVATE;

    @Column(name = "requester_id", nullable = false, updatable = false)
    private Long requesterId;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "resolved_on")
    private Instant resolvedOn;

    @Column(name = "closed_on")
    private Instant closedOn;

    @Column(name = "reopen_count", nullable = false)
    private int reopenCount = 0;

    // optimistic lock: two edits at once, second one fails with a conflict
    @Version
    @Column(nullable = false)
    private Long version;
}