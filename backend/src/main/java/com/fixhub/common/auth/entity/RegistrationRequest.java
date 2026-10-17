package com.fixhub.common.auth.entity;

import com.fixhub.common.audit.entity.AuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(
        name = "registration_request",
        indexes = {
                @Index(name = "idx_request_email", columnList = "email"),
                @Index(name = "idx_request_status", columnList = "request_status")
        }
)
@SQLDelete(sql = "UPDATE registration_request SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class RegistrationRequest extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_status", nullable = false, length = 20)
    private RequestStatus requestStatus = RequestStatus.PENDING;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_on")
    private Instant reviewedOn;

    public RegistrationRequest() {
    }

    public RegistrationRequest(String fullName, String email, String passwordHash) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public RequestStatus getRequestStatus() { return requestStatus; }
    public void setRequestStatus(RequestStatus requestStatus) { this.requestStatus = requestStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Long getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }

    public Instant getReviewedOn() { return reviewedOn; }
    public void setReviewedOn(Instant reviewedOn) { this.reviewedOn = reviewedOn; }
}