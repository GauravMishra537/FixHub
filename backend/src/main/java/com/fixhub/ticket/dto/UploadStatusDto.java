package com.fixhub.ticket.dto;

import java.util.List;

/** uploadedParts are the parts the storage already holds with the right size. The browser sends only the rest. */
public record UploadStatusDto(
        Long id,
        String status,
        long partSize,
        int partCount,
        List<Integer> uploadedParts) {
}