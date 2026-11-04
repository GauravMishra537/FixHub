package com.fixhub.resource.dto;

/**
 * departmentId = the one set on this category. effectiveDepartmentId = the one that really approves
 * (its own, else its group's). Both can be empty: then requests go straight to an admin.
 */
public record CategoryDto(
        Long id,
        String name,
        Long parentId,
        String icon,
        int sortOrder,
        boolean active,
        Long departmentId,
        Long effectiveDepartmentId,
        String effectiveDepartmentName,
        long subCategoryCount,
        long itemCount) {
}