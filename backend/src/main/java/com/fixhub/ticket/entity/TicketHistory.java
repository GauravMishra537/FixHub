package com.fixhub.ticket.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Timeline row. Append only: no update, no delete, no soft delete,
 * so it does not extend AuditEntity.
 */
@Getter
@Setter
@Entity
@Table(name = "ticket_history")
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false, updatable = false)
    private Long ticketId;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40, updatable = false)
    private HistoryAction action;

    @Column(name = "field_name", length = 50, updatable = false)
    private String fieldName;

    @Column(name = "from_value", columnDefinition = "text", updatable = false)
    private String fromValue;

    @Column(name = "to_value", columnDefinition = "text", updatable = false)
    private String toValue;

    @Column(length = 500, updatable = false)
    private String note;

    @Column(name = "created_on", nullable = false, updatable = false)
    private Instant createdOn = Instant.now();
}