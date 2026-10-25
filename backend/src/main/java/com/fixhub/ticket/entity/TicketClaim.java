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
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/** One try of an employee to take a ticket. */
@Getter
@Setter
@Entity
@Table(name = "ticket_claim")
@SQLDelete(sql = "UPDATE ticket_claim SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class TicketClaim extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    // the employee who claims
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClaimStatus status;

    // who decided and when. for an instant claim this is the claimer
    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "decided_on")
    private Instant decidedOn;

    @Column(name = "reject_reason", length = 255)
    private String rejectReason;
}