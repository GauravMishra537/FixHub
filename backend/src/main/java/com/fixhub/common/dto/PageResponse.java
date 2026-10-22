package com.fixhub.common.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Same shape as the audit logs page: items, totalElements, totalPages, plus page and size. */
public record PageResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}