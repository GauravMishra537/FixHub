package com.fixhub.resource.dto;

import java.util.List;

/** One department and its responsible person (empty when none is set). owns = categories that name this department. */
public record ApproverDto(
        Long departmentId,
        String departmentName,
        Long userId,
        String userName,
        List<String> owns) {
}