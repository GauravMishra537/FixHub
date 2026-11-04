package com.fixhub.resource.dto;

import java.util.List;

/** A sub-category with its visible items. departmentName = who approves, empty when an admin decides alone. */
public record CatalogCategoryDto(
        Long id,
        String name,
        String departmentName,
        List<CatalogItemDto> items) {
}