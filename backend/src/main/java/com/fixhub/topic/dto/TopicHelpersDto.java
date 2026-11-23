package com.fixhub.topic.dto;

import java.util.List;

/** nobodyHasSkill = the list is all users, so the screen shows a warning. */
public record TopicHelpersDto(boolean nobodyHasSkill, List<TopicHelperDto> users) {
}