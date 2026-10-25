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

/**
 * One routing rule: tickets of this type (and this category, if set) go to this department.
 * categoryId null = the rule covers the whole type.
 */
@Getter
@Setter
@Entity
@Table(name = "routing_rule")
@SQLDelete(sql = "UPDATE routing_rule SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class RoutingRule extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type", nullable = false, length = 30)
    private TicketType ticketType;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(nullable = false)
    private boolean active = true;
}