package com.fixhub.infra.dto;

import java.time.Instant;

/** One session in the form: which unit, from when to when. */
public record SessionRequestDto(
        Long infrastructureId,
        Instant startTime,
        Instant endTime,
        boolean allDay,
        // needed for all day, a long session, or a bigger unit than the headcount needs
        String reason) {
}