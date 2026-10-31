package com.fixhub.infra.entity;

/** PENDING and APPROVED hold the slot. REJECTED and CANCELLED free it. */
public enum BookingStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED
}