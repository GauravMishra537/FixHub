package com.fixhub.topic.dto;

/** A topic for the request form. helperCount = other users holding it as an approved skill. */
public record TopicSkillDto(Long id, String name, int helperCount) {
}