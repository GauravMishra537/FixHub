package com.fixhub.ticket.dto;

import java.time.Instant;

/** canDelete is true for the person who uploaded the file and for an admin. */
public record AttachmentResponseDto(
        Long id,
        Long ticketId,
        String fileName,
        String contentType,
        long sizeBytes,
        Long uploadedById,
        String uploadedByName,
        Instant createdOn,
        boolean canDelete) {
}