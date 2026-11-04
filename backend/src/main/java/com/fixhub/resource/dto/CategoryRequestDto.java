package com.fixhub.resource.dto;

/** Add or edit a category. parentId is used on add only: a category never moves. Empty parentId = a group. */
public record CategoryRequestDto(
        String name,
        Long parentId,
        String icon,
        Integer sortOrder,
        Boolean active,
        Long departmentId) {
}