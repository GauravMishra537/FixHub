package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.CommentRequestDto;
import com.fixhub.ticket.dto.CommentResponseDto;

import java.util.List;

public interface TicketCommentService {

    /** The thread of a ticket, oldest first. Anyone who can view the ticket. */
    List<CommentResponseDto> list(Long ticketId, TicketActor actor);

    /** Add a comment. The requester and the assignee are told. */
    CommentResponseDto add(Long ticketId, CommentRequestDto request, TicketActor actor);

    /** The writer or an admin removes a comment. */
    void delete(Long ticketId, Long commentId, TicketActor actor);
}