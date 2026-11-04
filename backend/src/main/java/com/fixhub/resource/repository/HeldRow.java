package com.fixhub.resource.repository;

/** One item and how many of it are held by requests. */
public interface HeldRow {

    Long getItemId();

    Long getHeld();
}