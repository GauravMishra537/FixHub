package com.fixhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectUserRequestDto {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}