package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.Attachment;
import com.fixhub.ticket.entity.AttachmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    // finished files of a ticket, oldest first. deleted rows are hidden by the entity
    List<Attachment> findByTicketIdAndStatusOrderByCreatedOnAscIdAsc(Long ticketId, AttachmentStatus status);

    // a file, only when it belongs to this ticket
    Optional<Attachment> findByIdAndTicketId(Long id, Long ticketId);

    // files of a ticket that count toward the limit: uploading and ready
    long countByTicketId(Long ticketId);

    // uploads one person has open right now
    long countByUploadedByAndStatus(Long uploadedBy, AttachmentStatus status);

    // for the cleanup job: uploads that never finished
    List<Attachment> findByStatusAndCreatedOnBefore(AttachmentStatus status, Instant before);
}