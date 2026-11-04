package com.fixhub.resource.entity;

/** PHYSICAL is counted and has a stock number. DIGITAL (license, cloud, tokens) has no limit. */
public enum ItemKind {
    PHYSICAL,
    DIGITAL
}