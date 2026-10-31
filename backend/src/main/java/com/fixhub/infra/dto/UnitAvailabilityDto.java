package com.fixhub.infra.dto;

/** One unit in the answer. oversize = bigger than the smallest fitting tier. */
public record UnitAvailabilityDto(
        Long id,
        String name,
        int capacity,
        String location,
        boolean oversize) {
}