package com.fixhub.infra.dto;

import java.util.List;

/** The whole form. One kind, one headcount, one or more sessions (one client visit over several days). */
public record BookingRequestDto(
        Long infraTypeId,
        String title,
        String note,
        Integer headcount,
        List<SessionRequestDto> sessions) {
}