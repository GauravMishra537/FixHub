package com.fixhub.resource.service;

import com.fixhub.resource.dto.ResourceRequestDto;
import com.fixhub.resource.dto.ResourceRequestResultDto;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.resource.dto.ResourceSettingsDto;
import com.fixhub.resource.dto.ResourceSettingsRequestDto;

/** Raising and (in later steps) deciding a resource request. */
public interface ResourceRequestService {

    /** One ticket, one request row. Checks the item, the quantity and the stock, then notifies who decides first. */
    ResourceRequestResultDto create(ResourceRequestDto request, TicketActor actor);

        /** Author or admin, while the ticket is not finished. Saved at once, version checked, written to history. */
    ResourceSettingsDto updateSettings(Long ticketId, ResourceSettingsRequestDto request, TicketActor actor);
}