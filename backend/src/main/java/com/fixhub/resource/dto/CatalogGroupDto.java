package com.fixhub.resource.dto;

import java.util.List;

public record CatalogGroupDto(
        Long id,
        String name,
        String icon,
        List<CatalogCategoryDto> categories) {
}