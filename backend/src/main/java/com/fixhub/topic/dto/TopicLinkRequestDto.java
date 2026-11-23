package com.fixhub.topic.dto;

import com.fixhub.topic.entity.LinkKind;

/** One learning link. kind empty = LINK. */
public record TopicLinkRequestDto(String title, String url, LinkKind kind) {
}