package com.fixhub.infra.dto;

/** Admin form for a kind. Null maxMinutes, sortOrder or active keeps the default (create) or the old value (update). */
public record InfraTypeRequestDto(
        String name,
        String description,
        String icon,
        Integer maxMinutes,
        Integer sortOrder,
        Boolean active) {
}