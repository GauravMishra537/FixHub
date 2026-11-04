package com.fixhub.resource.dto;

import com.fixhub.resource.entity.ItemKind;

/** Add or edit an item. categoryId is used on add only. totalStock is needed for PHYSICAL and ignored for DIGITAL. */
public record ItemRequestDto(
        Long categoryId,
        String name,
        String description,
        ItemKind kind,
        Integer totalStock,
        Integer maxPerRequest,
        Boolean active) {
}