package com.fixhub.ticket.dto;

/** The browser slices the file by partSize and sends partCount parts. */
public record AttachmentStartResponseDto(Long id, long partSize, int partCount) {
}