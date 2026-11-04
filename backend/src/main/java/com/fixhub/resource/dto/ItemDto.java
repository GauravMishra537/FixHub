package com.fixhub.resource.dto;

import com.fixhub.resource.entity.ItemKind;

/** totalStock, heldStock and availableStock are empty for a DIGITAL item. */
public record ItemDto(
        Long id,
        Long categoryId,
        String name,
        String description,
        ItemKind kind,
        Integer totalStock,
        Long heldStock,
        Long availableStock,
        int maxPerRequest,
        boolean active) {
}