package com.fixhub.infra.dto;

/** A kind with its counts. maxCapacity lets the form warn when the headcount is bigger than any unit. */
public record InfraTypeDto(
        Long id,
        String name,
        String description,
        String icon,
        int maxMinutes,
        int sortOrder,
        boolean active,
        int unitCount,
        int activeUnitCount,
        int maxCapacity) {
}