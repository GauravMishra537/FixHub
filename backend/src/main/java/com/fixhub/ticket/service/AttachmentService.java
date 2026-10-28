package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.AttachmentLinkDto;
import com.fixhub.ticket.dto.AttachmentResponseDto;
import com.fixhub.ticket.dto.AttachmentStartRequestDto;
import com.fixhub.ticket.dto.AttachmentStartResponseDto;
import com.fixhub.ticket.dto.PartLinkDto;
import com.fixhub.ticket.dto.UploadStatusDto;

import java.util.List;

public interface AttachmentService {

    /** Checks the rules, starts the upload in storage, saves a row in state UPLOADING. */
    AttachmentStartResponseDto start(Long ticketId, AttachmentStartRequestDto request, TicketActor actor);

    /** Signed links for the parts the browser asks for. Only the uploader. */
    List<PartLinkDto> partLinks(Long ticketId, Long attachmentId, List<Integer> partNumbers, TicketActor actor);

    /** Which parts the storage holds. Used to resume a broken upload. */
    UploadStatusDto status(Long ticketId, Long attachmentId, TicketActor actor);

    /** Checks the parts, joins them, checks size and type, marks the file READY. */
    AttachmentResponseDto complete(Long ticketId, Long attachmentId, TicketActor actor);

    /** Cancels an upload that is not finished. */
    void abort(Long ticketId, Long attachmentId, TicketActor actor);

    /** Finished files of a ticket. Anyone who can view the ticket. */
    List<AttachmentResponseDto> list(Long ticketId, TicketActor actor);

        /** A short signed link. inline true is for the viewer, false is a download. Anyone who can view the ticket. */
    AttachmentLinkDto downloadLink(Long ticketId, Long attachmentId, boolean inline, TicketActor actor);
    /** Soft delete. The uploader or an admin. */
    void delete(Long ticketId, Long attachmentId, TicketActor actor);

    /** For the cleanup job: abort uploads that never finished. Returns how many. */
    int cleanStaleUploads();
}