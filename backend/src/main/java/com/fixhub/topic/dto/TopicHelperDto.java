package com.fixhub.topic.dto;

/** One person the admin can pick. declined = already said "I'm busy" on this ticket. */
public record TopicHelperDto(Long id, String fullName, boolean declined) {
}