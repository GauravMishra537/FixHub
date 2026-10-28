package com.fixhub.common.storage;

/** One part the storage already holds for an upload. */
public record StoredPart(int partNumber, long size, String eTag) {
}