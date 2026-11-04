package com.fixhub.resource.service;

import com.fixhub.resource.dto.CatalogGroupDto;
import com.fixhub.resource.dto.ResourceApprovalDto;
import com.fixhub.resource.dto.ResourceRequestDetailDto;
import com.fixhub.ticket.service.TicketActor;

import java.util.List;

/** What users read: the catalog, one request, and the requests waiting for them. */
public interface ResourceQueryService {

    // visible groups, sub-categories and items, with the stock left
    List<CatalogGroupDto> catalog();

    // the request behind one ticket. only people who may view the ticket
    ResourceRequestDetailDto details(Long ticketId, TicketActor actor);

    // requests waiting for this person at the department step, oldest first
    List<ResourceApprovalDto> approvals(TicketActor actor);

    long approvalCount(TicketActor actor);
}