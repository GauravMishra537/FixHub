package com.fixhub.infra.dto;

import com.fixhub.infra.entity.InfrastructureStatus;

import java.util.List;

public record BoardUnitDto(
        Long id,
        String name,
        int capacity,
        String location,
        InfrastructureStatus status,
        List<BoardSlotDto> slots) {
}