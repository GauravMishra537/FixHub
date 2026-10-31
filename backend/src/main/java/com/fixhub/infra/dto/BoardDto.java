package com.fixhub.infra.dto;

import java.time.Instant;
import java.util.List;

public record BoardDto(
        Long infraTypeId,
        String kindName,
        Instant from,
        Instant to,
        List<BoardUnitDto> units) {
}