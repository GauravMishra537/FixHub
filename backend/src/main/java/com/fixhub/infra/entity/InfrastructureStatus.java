package com.fixhub.infra.entity;

/** ACTIVE units can be booked. OUT_OF_SERVICE is switched off by an admin (repair, closed). */
public enum InfrastructureStatus {
    ACTIVE,
    OUT_OF_SERVICE
}