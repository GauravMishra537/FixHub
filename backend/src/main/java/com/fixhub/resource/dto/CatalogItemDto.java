package com.fixhub.resource.dto;

import com.fixhub.resource.entity.ItemKind;

/** available is how many are left for a PHYSICAL item. Empty for DIGITAL: no limit. */
public record CatalogItemDto(
        Long id,
        String name,
        String description,
        ItemKind kind,
        Long available,
        int maxPerRequest) {
}