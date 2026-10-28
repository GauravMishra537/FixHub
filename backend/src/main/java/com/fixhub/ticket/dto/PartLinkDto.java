package com.fixhub.ticket.dto;

/** A signed link. The browser PUTs the bytes of this part to it. */
public record PartLinkDto(int partNumber, String url) {
}