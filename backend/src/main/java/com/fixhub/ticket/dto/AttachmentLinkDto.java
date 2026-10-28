package com.fixhub.ticket.dto;

/** A short link that downloads one file. */
public record AttachmentLinkDto(String url, long expiresInSeconds) {
}