package com.fixhub.common.audit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditEntity {

    @CreatedDate
    @Column(name = "created_on", nullable = false, updatable = false)
    private Instant createdOn;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @LastModifiedDate
    @Column(name = "updated_on", nullable = false)
    private Instant updatedOn;

    @LastModifiedBy
    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "deleted_on")
    private Instant deletedOn;

    @Column(name = "deleted_by")
    private Long deletedBy;

    public boolean isDeleted() {
        return deletedOn != null;
    }

    public void softDelete(Long actorId) {
        this.deletedOn = Instant.now();
        this.deletedBy = actorId;
    }

    public Instant getCreatedOn() { return createdOn; }
    public Long getCreatedBy() { return createdBy; }
    public Instant getUpdatedOn() { return updatedOn; }
    public Long getUpdatedBy() { return updatedBy; }
    public Instant getDeletedOn() { return deletedOn; }
    public Long getDeletedBy() { return deletedBy; }
}