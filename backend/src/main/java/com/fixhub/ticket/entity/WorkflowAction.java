package com.fixhub.ticket.entity;

/** A move the person working on a ticket, or the person who raised it, can make. */
public enum WorkflowAction {

    START("Start work", false),
    HOLD("Put on hold", true),
    RESUME("Resume work", false),
    RESOLVE("Mark resolved", true),
    CONFIRM("Confirm and close", false),
    REOPEN("Reopen", true),
    CANCEL("Cancel ticket", false);

    private final String label;
    private final boolean noteRequired;

    WorkflowAction(String label, boolean noteRequired) {
        this.label = label;
        this.noteRequired = noteRequired;
    }

    /** Text for the button. */
    public String label() {
        return label;
    }

    /** True when the person must type a reason or a note. */
    public boolean noteRequired() {
        return noteRequired;
    }
}