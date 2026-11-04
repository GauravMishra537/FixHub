package com.fixhub.resource.entity;

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
import java.time.LocalDate;

/** What was asked for one ticket and how it was decided. holding = the quantity counts against the stock. */
@Getter
@Setter
@Entity
@Table(name = "resource_request")
@SQLDelete(sql = "UPDATE resource_request SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class ResourceRequest extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false, updatable = false)
    private Long ticketId;

    @Column(name = "item_id", nullable = false, updatable = false)
    private Long itemId;

    @Column(nullable = false, updatable = false)
    private int quantity;

    @Column(length = 500)
    private String reason;

    @Column(name = "needed_by")
    private LocalDate neededBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.PENDING_DEPT;

    @Column(nullable = false)
    private boolean holding = true;

    // the department's person as it was when the request was made. empty: no approver, goes to an admin
    @Column(name = "dept_approver_id")
    private Long deptApproverId;

    @Column(name = "dept_decided_by")
    private Long deptDecidedBy;

    @Column(name = "dept_decided_on")
    private Instant deptDecidedOn;

    @Column(name = "dept_note", length = 500)
    private String deptNote;

    @Column(name = "admin_decided_by")
    private Long adminDecidedBy;

    @Column(name = "admin_decided_on")
    private Instant adminDecidedOn;

    @Column(name = "admin_note", length = 500)
    private String adminNote;
}