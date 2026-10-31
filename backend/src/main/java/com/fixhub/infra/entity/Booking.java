package com.fixhub.infra.entity;

import com.fixhub.common.audit.entity.AuditEntity;
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
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * One session: this unit, this time, for this meeting.
 * Many sessions can belong to one ticket (a client visit over several days).
 * The person who booked is ticket.authorId.
 */
@Getter
@Setter
@Entity
@Table(name = "booking")
@SQLDelete(sql = "UPDATE booking SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class Booking extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "infrastructure_id", nullable = false)
    private Long infrastructureId;

    // team of the booker at booking time
    @Column(name = "department_id")
    private Long departmentId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private int headcount;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "all_day", nullable = false)
    private boolean allDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status = BookingStatus.PENDING;

    // needed for all day, a long session, or a bigger room than the headcount needs
    @Column(length = 500)
    private String reason;

    @Column(nullable = false)
    private boolean oversize;

    // who approved, rejected or cancelled, when, and the note typed
    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "decided_on")
    private Instant decidedOn;

    @Column(name = "decision_note", length = 500)
    private String decisionNote;
}