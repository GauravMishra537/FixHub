package com.fixhub.ticket.entity;

/** A move the person working on a ticket, the person who raised it, or an admin can make. */
public enum WorkflowAction {

    START("Start work", false),
    HOLD("Put on hold", true),
    RESUME("Resume work", false),
    RESOLVE("Mark resolved", true),
    CONFIRM("Confirm and close", false),
    REOPEN("Reopen", true),
    CANCEL("Cancel ticket", false),
    // infra booking: the admin decides
    APPROVE("Approve", false),
    REJECT("Reject", true),
    // resource request: the department approver decides first, then the admin (APPROVE and REJECT above)
    DEPT_APPROVE("Approve", false),
    DEPT_REJECT("Reject", true),
    // resource request: the author closes it once the item is received
    CLOSE("Close", false);

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