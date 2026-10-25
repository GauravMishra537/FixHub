package com.fixhub.notification.entity;

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

/** One message for one person. Clearing it is a soft delete. */
@Getter
@Setter
@Entity
@Table(name = "notification")
@SQLDelete(sql = "UPDATE notification SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class Notification extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // who gets the message
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    // the ticket to open when the message is clicked
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(nullable = false, length = 255)
    private String message;

    // empty = unread
    @Column(name = "read_on")
    private Instant readOn;
}