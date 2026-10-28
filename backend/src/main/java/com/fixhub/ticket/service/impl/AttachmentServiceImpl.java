package com.fixhub.ticket.service.impl;

import com.fixhub.common.storage.ObjectStore;
import com.fixhub.common.storage.StorageProperties;
import com.fixhub.common.storage.StoredPart;
import com.fixhub.ticket.dto.AttachmentLinkDto;
import com.fixhub.ticket.dto.AttachmentResponseDto;
import com.fixhub.ticket.dto.AttachmentStartRequestDto;
import com.fixhub.ticket.dto.AttachmentStartResponseDto;
import com.fixhub.ticket.dto.PartLinkDto;
import com.fixhub.ticket.dto.UploadStatusDto;
import com.fixhub.ticket.entity.Attachment;
import com.fixhub.ticket.entity.AttachmentStatus;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.repository.AttachmentRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.AttachmentValidator;
import com.fixhub.ticket.service.AttachmentService;
import com.fixhub.ticket.service.AttachmentTypes;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AttachmentServiceImpl implements AttachmentService {

    // no new files once a ticket is finished
    private static final Set<TicketStatus> FINISHED = Set.of(
            TicketStatus.CLOSED, TicketStatus.CANCELLED, TicketStatus.REJECTED, TicketStatus.RETURNED);

    private final TicketRepository ticketRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final TicketRules rules;
    private final ObjectStore store;
    private final StorageProperties props;
    private final AttachmentValidator validator;

    public AttachmentServiceImpl(TicketRepository ticketRepository,
                                 AttachmentRepository attachmentRepository,
                                 UserRepository userRepository,
                                 TicketRules rules,
                                 ObjectStore store,
                                 StorageProperties props,
                                AttachmentValidator validator) {
        this.ticketRepository = ticketRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.rules = rules;
        this.store = store;
        this.props = props;
        this.validator=validator;
    }

    // ---------- upload ----------

    @Override
    @Transactional
    public AttachmentStartResponseDto start(Long ticketId, AttachmentStartRequestDto request, TicketActor actor) {
        Ticket ticket = findViewable(ticketId, actor);

        boolean mayUpload = actor.admin()
                || actor.id().equals(ticket.getAuthorId())
                || actor.id().equals(ticket.getAssigneeId());
        if (!mayUpload) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the requester, the assignee or an admin can add files");
        }
        if (FINISHED.contains(ticket.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is finished. Files cannot be added");
        }

         // name, extension, MIME and size: one validator
        AttachmentValidator.ValidFile file = validator.validateBeforeUpload(request.getFileName(), request.getSizeBytes());
        String name = file.name();
        String contentType = file.mimeType();
        long size = file.sizeBytes();


        if (attachmentRepository.countByTicketId(ticketId) >= props.getMaxFilesPerTicket()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A ticket can have at most " + props.getMaxFilesPerTicket() + " files");
        }
        if (attachmentRepository.countByUploadedByAndStatus(actor.id(), AttachmentStatus.UPLOADING)
                >= props.getMaxOpenUploadsPerUser()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Too many uploads are running. Finish or cancel one first");
        }

        // the key is made here. nothing from the browser goes into it
        String key = "tickets/" + ticketId + "/" + UUID.randomUUID();
        String uploadId = store.startMultipart(key, contentType);

        Attachment attachment = new Attachment();
        attachment.setTicketId(ticketId);
        attachment.setUploadedBy(actor.id());
        attachment.setOriginalName(name);
        attachment.setObjectKey(key);
        attachment.setUploadId(uploadId);
        attachment.setContentType(contentType);
        attachment.setSizeBytes(size);
        attachment.setStatus(AttachmentStatus.UPLOADING);

        Attachment saved;
        try {
            saved = attachmentRepository.save(attachment);
        } catch (RuntimeException e) {
            store.abort(key, uploadId);
            throw e;
        }
        return new AttachmentStartResponseDto(saved.getId(), props.getPartSizeBytes(), partCountOf(size));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartLinkDto> partLinks(Long ticketId, Long attachmentId, List<Integer> partNumbers,
                                       TicketActor actor) {
        Attachment attachment = ownOpenUpload(ticketId, attachmentId, actor);

        int partCount = partCountOf(attachment.getSizeBytes());
        Set<Integer> wanted = new HashSet<>(partNumbers);
        if (wanted.size() != partNumbers.size() || wanted.size() > partCount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Part numbers are not valid");
        }
        for (Integer n : wanted) {
            if (n == null || n < 1 || n > partCount) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Part numbers must be 1 to " + partCount);
            }
        }

        return partNumbers.stream()
                .map(n -> new PartLinkDto(n, store.presignPart(attachment.getObjectKey(), attachment.getUploadId(), n)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UploadStatusDto status(Long ticketId, Long attachmentId, TicketActor actor) {
        findViewable(ticketId, actor);
        Attachment attachment = findAttachment(ticketId, attachmentId);
        requireUploader(attachment, actor, false);

        int partCount = partCountOf(attachment.getSizeBytes());
        if (attachment.getStatus() == AttachmentStatus.READY) {
            List<Integer> all = java.util.stream.IntStream.rangeClosed(1, partCount).boxed().toList();
            return new UploadStatusDto(attachment.getId(), attachment.getStatus().name(),
                    props.getPartSizeBytes(), partCount, all);
        }

        // a part counts only when it has the size it must have. a wrong one is sent again
        List<Integer> good = store.listParts(attachment.getObjectKey(), attachment.getUploadId()).stream()
                .filter(p -> p.partNumber() >= 1 && p.partNumber() <= partCount
                        && p.size() == expectedPartSize(attachment.getSizeBytes(), p.partNumber()))
                .map(StoredPart::partNumber)
                .sorted()
                .toList();
        return new UploadStatusDto(attachment.getId(), attachment.getStatus().name(),
                props.getPartSizeBytes(), partCount, good);
    }

    // a failed check deletes the row. that must not roll back, so the exception does not undo it
    @Override
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AttachmentResponseDto complete(Long ticketId, Long attachmentId, TicketActor actor) {
        Attachment attachment = ownOpenUpload(ticketId, attachmentId, actor);

        int partCount = partCountOf(attachment.getSizeBytes());
        List<StoredPart> held = store.listParts(attachment.getObjectKey(), attachment.getUploadId());
        Map<Integer, StoredPart> byNumber = held.stream()
                .collect(Collectors.toMap(StoredPart::partNumber, p -> p, (a, b) -> b));

        // every part there, every size right. the declared size is not trusted, the parts are
        boolean whole = byNumber.size() == partCount;
        for (int n = 1; whole && n <= partCount; n++) {
            StoredPart part = byNumber.get(n);
            whole = part != null && part.size() == expectedPartSize(attachment.getSizeBytes(), n);
        }
        if (!whole) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Upload is not complete. Send the missing parts again");
        }

        store.complete(attachment.getObjectKey(), attachment.getUploadId(), held);
        
        // Calculate real size from the held parts list using part.size()
        long realSize = held.stream().mapToLong(part -> part.size()).sum();

        // last checks on what the storage really holds
        byte[] head = store.readFirstBytes(attachment.getObjectKey(), (int) Math.min(AttachmentTypes.HEAD_BYTES, realSize));

        if (realSize != attachment.getSizeBytes() || !validator.contentMatches(attachment.getOriginalName(), head)) {
            store.delete(attachment.getObjectKey());
            attachmentRepository.delete(attachment);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The file content does not match its type or size");
        }



        attachment.setStatus(AttachmentStatus.READY);
        attachment.setUploadId(null);
        attachment.setReadyOn(Instant.now());
        Attachment saved = attachmentRepository.save(attachment);
        return toDto(saved, Map.of(actor.id(), userName(actor.id())), actor);
    }

    @Override
    @Transactional
    public void abort(Long ticketId, Long attachmentId, TicketActor actor) {
        findViewable(ticketId, actor);
        Attachment attachment = findAttachment(ticketId, attachmentId);
        requireUploader(attachment, actor, true);
        if (attachment.getStatus() != AttachmentStatus.UPLOADING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This file is already uploaded. Delete it instead");
        }
        store.abort(attachment.getObjectKey(), attachment.getUploadId());
        attachmentRepository.delete(attachment);
    }

    // ---------- read and delete ----------

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponseDto> list(Long ticketId, TicketActor actor) {
        findViewable(ticketId, actor);

        List<Attachment> rows = attachmentRepository
                .findByTicketIdAndStatusOrderByCreatedOnAscIdAsc(ticketId, AttachmentStatus.READY);
        Map<Long, String> names = userNames(rows);
        return rows.stream().map(a -> toDto(a, names, actor)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AttachmentLinkDto downloadLink(Long ticketId, Long attachmentId, boolean inline, TicketActor actor) {
        findViewable(ticketId, actor);
        Attachment attachment = findAttachment(ticketId, attachmentId);
        if (attachment.getStatus() != AttachmentStatus.READY) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        // only safe types may open inside the browser. everything else is a download
        if (inline && !AttachmentTypes.canPreview(attachment.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This file type cannot be viewed here. Download it");
        }
        String type = inline && "text/plain".equals(attachment.getContentType())
                ? "text/plain; charset=utf-8"
                : attachment.getContentType();
        String url = store.presignDownload(attachment.getObjectKey(), attachment.getOriginalName(), type, inline);
        return new AttachmentLinkDto(url, Duration.ofMinutes(props.getDownloadUrlMinutes()).toSeconds());
    }

    // soft delete. the bytes stay in the storage for now, the row hides the file
    @Override
    @Transactional
    public void delete(Long ticketId, Long attachmentId, TicketActor actor) {
        findViewable(ticketId, actor);
        Attachment attachment = findAttachment(ticketId, attachmentId);
        requireUploader(attachment, actor, true);
        if (attachment.getStatus() != AttachmentStatus.READY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Upload is not finished. Cancel it instead");
        }
        attachmentRepository.delete(attachment);
    }

    // ---------- cleanup ----------

    @Override
    @Transactional
    public int cleanStaleUploads() {
        Instant before = Instant.now().minus(Duration.ofHours(props.getStaleUploadHours()));
        int cleaned = 0;
        for (Attachment stale : attachmentRepository.findByStatusAndCreatedOnBefore(AttachmentStatus.UPLOADING, before)) {
            try {
                store.abort(stale.getObjectKey(), stale.getUploadId());
                attachmentRepository.delete(stale);
                cleaned++;
            } catch (Exception e) {
                // storage is off. try again at the next run
                log.warn("Could not clean upload {}: {}", stale.getId(), e.getMessage());
            }
        }
        return cleaned;
    }

    // ---------- helpers ----------

    private Ticket findViewable(Long ticketId, TicketActor actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        return ticket;
    }

    private Attachment findAttachment(Long ticketId, Long attachmentId) {
        return attachmentRepository.findByIdAndTicketId(attachmentId, ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    // an upload that is still running, and only its uploader may drive it
    private Attachment ownOpenUpload(Long ticketId, Long attachmentId, TicketActor actor) {
        findViewable(ticketId, actor);
        Attachment attachment = findAttachment(ticketId, attachmentId);
        requireUploader(attachment, actor, false);
        if (attachment.getStatus() != AttachmentStatus.UPLOADING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This upload is already finished");
        }
        return attachment;
    }

    private void requireUploader(Attachment attachment, TicketActor actor, boolean adminAllowed) {
        boolean own = actor.id().equals(attachment.getUploadedBy());
        if (!own && !(adminAllowed && actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This file belongs to someone else");
        }
    }

    private int partCountOf(long size) {
        long part = props.getPartSizeBytes();
        return (int) ((size + part - 1) / part);
    }

    // all parts are partSize, the last one is what is left
    private long expectedPartSize(long size, int partNumber) {
        long part = props.getPartSizeBytes();
        int count = partCountOf(size);
        return partNumber < count ? part : size - part * (count - 1L);
    }

    // drop any folder part and control characters. what is left is shown, never used as a path
    // private static String cleanName(String raw) {
    //     String name = raw == null ? "" : raw;
    //     int cut = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
    //     if (cut >= 0) {
    //         name = name.substring(cut + 1);
    //     }
    //     return name.replaceAll("\\p{Cntrl}", "").trim();
    // }

    private Map<Long, String> userNames(List<Attachment> rows) {
        Set<Long> ids = rows.stream().map(Attachment::getUploadedBy).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private AttachmentResponseDto toDto(Attachment a, Map<Long, String> names, TicketActor actor) {
        boolean canDelete = actor.admin() || actor.id().equals(a.getUploadedBy());
        return new AttachmentResponseDto(a.getId(), a.getTicketId(), a.getOriginalName(), a.getContentType(),
                a.getSizeBytes(), a.getUploadedBy(),
                names.getOrDefault(a.getUploadedBy(), "#" + a.getUploadedBy()),
                a.getCreatedOn(), canDelete);
    }
}