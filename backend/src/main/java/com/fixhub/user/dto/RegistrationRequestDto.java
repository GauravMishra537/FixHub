package com.fixhub.user.dto;

import com.fixhub.common.auth.entity.RequestStatus;

import java.time.Instant;

public class RegistrationRequestDto {

    private Long id;
    private String fullName;
    private String email;
    private boolean emailVerified;
    private RequestStatus requestStatus;
    private String rejectionReason;
    private Instant createdAt;
    private Instant reviewedOn;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public RequestStatus getRequestStatus() { return requestStatus; }
    public void setRequestStatus(RequestStatus requestStatus) { this.requestStatus = requestStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getReviewedOn() { return reviewedOn; }
    public void setReviewedOn(Instant reviewedOn) { this.reviewedOn = reviewedOn; }
}