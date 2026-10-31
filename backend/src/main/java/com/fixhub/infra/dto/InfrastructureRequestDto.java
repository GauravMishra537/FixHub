package com.fixhub.infra.dto;

import com.fixhub.infra.entity.InfrastructureStatus;

/** Admin form for a unit. infraTypeId is used on create only. A unit never moves to another kind. */
public record InfrastructureRequestDto(
        Long infraTypeId,
        String name,
        Integer capacity,
        String location,
        String note,
        InfrastructureStatus status) {
}