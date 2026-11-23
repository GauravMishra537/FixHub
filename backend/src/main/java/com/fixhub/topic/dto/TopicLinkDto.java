package com.fixhub.topic.dto;

import com.fixhub.topic.entity.LinkKind;

import java.time.Instant;

public record TopicLinkDto(
        Long id,
        Long ticketId,
        String title,
        String url,
        LinkKind kind,
        Long addedBy,
        String addedByName,
        Instant createdOn,
        boolean canDelete) {
}