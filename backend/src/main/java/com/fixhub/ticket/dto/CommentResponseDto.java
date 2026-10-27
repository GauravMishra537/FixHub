package com.fixhub.ticket.dto;

import java.time.Instant;

/** canDelete is true for the writer of the comment and for an admin. */
public record CommentResponseDto(
        Long id,
        Long ticketId,
        Long authorId,
        String authorName,
        String body,
        Instant createdOn,
        boolean canDelete) {
}