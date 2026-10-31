package com.fixhub.infra.dto;

import com.fixhub.infra.entity.InfrastructureStatus;

/** upcomingBookings = sessions still holding this unit. The console warns before switching it off. */
public record InfrastructureDto(
        Long id,
        Long infraTypeId,
        String name,
        int capacity,
        String location,
        String note,
        InfrastructureStatus status,
        long upcomingBookings) {
}