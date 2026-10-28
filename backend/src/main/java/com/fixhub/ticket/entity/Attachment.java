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

/** One file on a ticket. The bytes live in object storage, under objectKey. */
@Getter
@Setter
@Entity
@Table(name = "attachment")
@SQLDelete(sql = "UPDATE attachment SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class Attachment extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    // name as the person saw it. display only, never used in the key
    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    // made by the server, for example tickets/12/6f1c...
    @Column(name = "object_key", nullable = false, length = 255)
    private String objectKey;

    // the storage's multipart id. empty once the upload is complete
    @Column(name = "upload_id", length = 255)
    private String uploadId;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttachmentStatus status = AttachmentStatus.UPLOADING;

    @Column(name = "ready_on")
    private Instant readyOn;
}