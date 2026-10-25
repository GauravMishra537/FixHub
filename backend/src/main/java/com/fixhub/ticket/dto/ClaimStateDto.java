package com.fixhub.ticket.dto;

import com.fixhub.ticket.entity.ClaimStatus;

/** What the logged in person can do about claiming one ticket. */
public record ClaimStateDto(
        boolean canClaim,
        ClaimStatus myClaim,
        boolean requiresApproval) {
}