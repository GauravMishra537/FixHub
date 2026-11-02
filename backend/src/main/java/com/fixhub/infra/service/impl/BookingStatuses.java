package com.fixhub.infra.service.impl;

import com.fixhub.infra.entity.Booking;
import com.fixhub.infra.entity.BookingStatus;
import com.fixhub.ticket.entity.TicketStatus;

import java.util.List;

/** Session states to ticket status. Used by approve all, reject all and the per-session buttons. */
final class BookingStatuses {

    private BookingStatuses() {
    }

    /**
     * Any session still waiting: PENDING_APPROVAL.
     * Else all approved: APPROVED. Some approved, some not: PARTIALLY_APPROVED.
     * None approved: REJECTED when an admin rejected one, else CANCELLED.
     */
    static TicketStatus resolve(List<Booking> sessions) {
        int approved = 0;
        int rejected = 0;
        int other = 0; // cancelled
        for (Booking b : sessions) {
            switch (b.getStatus()) {
                case PENDING -> {
                    return TicketStatus.PENDING_APPROVAL;
                }
                case APPROVED -> approved++;
                case REJECTED -> rejected++;
                case CANCELLED -> other++;
            }
        }
        if (approved > 0) {
            return rejected + other == 0 ? TicketStatus.APPROVED : TicketStatus.PARTIALLY_APPROVED;
        }
        return rejected > 0 ? TicketStatus.REJECTED : TicketStatus.CANCELLED;
    }
}