package com.fixhub.infra.dto;

/** note = reason. Required for reject, ignored for approve. */
public record SessionDecisionRequestDto(String note) {
}