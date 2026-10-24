package com.fixhub.ticket.service.impl;

import com.fixhub.common.dto.PageResponse;
import com.fixhub.ticket.dto.TicketCategoryCountDto;
import com.fixhub.ticket.dto.TicketCreateRequestDto;
import com.fixhub.ticket.dto.TicketHistoryResponseDto;
import com.fixhub.ticket.dto.TicketListItemDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.dto.TicketSearchRequestDto;
import com.fixhub.ticket.dto.TicketSummaryDto;
import com.fixhub.ticket.dto.TicketUpdateRequestDto;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import com.fixhub.ticket.mapper.TicketMapper;
import com.fixhub.ticket.mapper.TicketMapper.Names;
import com.fixhub.ticket.repository.TicketCategoryRepository;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.repository.TicketSpecifications;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketCategoryService;
import com.fixhub.ticket.service.TicketHistoryService;
import com.fixhub.ticket.service.TicketNumberService;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.ticket.service.TicketService;
import com.fixhub.user.entity.Department;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.DepartmentRepository;
import com.fixhub.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TicketServiceImpl implements TicketService {

    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 50;

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TicketCategoryService categoryService;
    private final TicketNumberService numberService;
    private final TicketHistoryService historyService;
    private final TicketRules rules;
    private final TicketMapper mapper;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             TicketHistoryRepository historyRepository,
                             TicketCategoryRepository categoryRepository,
                             UserRepository userRepository,
                             DepartmentRepository departmentRepository,
                             TicketCategoryService categoryService,
                             TicketNumberService numberService,
                             TicketHistoryService historyService,
                             TicketRules rules,
                             TicketMapper mapper) {
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.categoryService = categoryService;
        this.numberService = numberService;
        this.historyService = historyService;
        this.rules = rules;
        this.mapper = mapper;
    }

    // ---------- create ----------

    @Override
    @Transactional
    public TicketResponseDto create(TicketCreateRequestDto request, TicketActor actor) {
        TicketType type = request.getType();
        if (!rules.isCreatable(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This ticket type is not available yet");
        }

        Ticket ticket = new Ticket();
        ticket.setType(type);
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(clean(request.getDescription()));
        ticket.setStatus(rules.initialStatus(type));
        ticket.setPriority(request.getPriority() == null ? TicketPriority.MEDIUM : request.getPriority());
        ticket.setVisibility(request.getVisibility() == null ? TicketVisibility.PUBLIC : request.getVisibility());
        ticket.setAuthorId(actor.id());
        ticket.setCategoryId(resolveCategoryId(type, request.getCategoryName()));
        // department stays empty. routing rules fill it in Commit 15
        ticket.setTicketNo(numberService.nextTicketNo());

        Ticket saved = ticketRepository.save(ticket);
        historyService.recordCreated(saved.getId(), actor.id());
        return toResponse(saved, actor);
    }

    // ---------- read ----------

    @Override
    @Transactional(readOnly = true)
    public TicketResponseDto get(Long id, TicketActor actor) {
        Ticket ticket = findViewable(id, actor);
        return toResponse(ticket, actor);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketListItemDto> listVisible(TicketActor actor, int page, int size) {
        Page<Ticket> result = ticketRepository.findVisible(actor.admin(), actor.id(), pageable(page, size));
        return toPage(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketListItemDto> listMine(TicketActor actor, String group, int page, int size) {
        Pageable pageable = pageable(page, size);
        String g = group == null ? "" : group.trim().toUpperCase();
        Page<Ticket> result = switch (g) {
            case "" -> ticketRepository.findByAuthorId(actor.id(), pageable);
            case "PENDING" -> ticketRepository.findByAuthorIdAndStatusIn(
                    actor.id(), rules.pendingStatuses(), pageable);
            case "RESOLVED" -> ticketRepository.findByAuthorIdAndStatusIn(
                    actor.id(), rules.resolvedStatuses(), pageable);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Group must be PENDING or RESOLVED");
        };
        return toPage(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TicketListItemDto> search(TicketSearchRequestDto request, TicketActor actor) {
        // group PENDING / RESOLVED is turned into the real status list here, rules live in one place
        Collection<TicketStatus> groupStatuses = null;
        String group = request.groupName();
        if (group != null) {
            groupStatuses = "PENDING".equals(group) ? rules.pendingStatuses() : rules.resolvedStatuses();
        }

        Page<Ticket> result = ticketRepository.findAll(
                TicketSpecifications.build(request, actor, groupStatuses),
                TicketSpecifications.pageable(request));
        return toPage(result);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketCategoryCountDto> categoryCounts(TicketType type, TicketActor actor) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : ticketRepository.countByCategoryVisible(type, actor.admin(), actor.id())) {
            counts.put((Long) row[0], (Long) row[1]);
        }

        // every active category, even with 0 tickets. a disabled one only while tickets still use it
        return categoryRepository.findByTicketTypeOrderByNameAsc(type).stream()
                .filter(c -> c.isActive() || counts.containsKey(c.getId()))
                .map(c -> new TicketCategoryCountDto(c.getId(), c.getName(), counts.getOrDefault(c.getId(), 0L)))
                .sorted(Comparator.comparingLong(TicketCategoryCountDto::count).reversed()
                        .thenComparing(TicketCategoryCountDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TicketSummaryDto summary(TicketActor actor) {
        return new TicketSummaryDto(
                ticketRepository.countVisible(actor.admin(), actor.id()),
                ticketRepository.countByAuthorId(actor.id()),
                ticketRepository.countByAuthorIdAndStatusIn(actor.id(), rules.pendingStatuses()),
                ticketRepository.countByAuthorIdAndStatusIn(actor.id(), rules.resolvedStatuses()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketHistoryResponseDto> history(Long id, TicketActor actor) {
        findViewable(id, actor);
        List<TicketHistory> rows = historyRepository.findByTicketIdOrderByCreatedOnAscIdAsc(id);

        Set<Long> actorIds = rows.stream()
                .map(TicketHistory::getActorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> users = userNames(actorIds);

        return rows.stream().map(h -> mapper.toHistory(h, users)).toList();
    }

    // ---------- update ----------

    @Override
    @Transactional
    public TicketResponseDto update(Long id, TicketUpdateRequestDto request, TicketActor actor) {
        Ticket ticket = findViewable(id, actor);

        boolean author = actor.id().equals(ticket.getAuthorId());
        // the person who raised it edits everything while the status allows it
        boolean fullEdit = author && rules.editDeniedReason(ticket, actor.id()) == null;
        // an admin changes only category and priority
        boolean triageOnly = !fullEdit && rules.canTriage(ticket, actor.admin());

        if (!fullEdit && !triageOnly) {
            throw new ResponseStatusException(
                    author ? HttpStatus.CONFLICT : HttpStatus.FORBIDDEN,
                    rules.editDeniedReason(ticket, actor.id()));
        }
        // the user edited an old copy of the page
        if (!Objects.equals(request.getVersion(), ticket.getVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This ticket was changed by someone else. Reload the page and try again");
        }

        // for an admin the title, description and visibility from the request are ignored
        String title = fullEdit ? request.getTitle().trim() : ticket.getTitle();
        String description = fullEdit ? clean(request.getDescription()) : ticket.getDescription();
        TicketVisibility visibility = fullEdit ? request.getVisibility() : ticket.getVisibility();
        Long newCategoryId = resolveCategoryId(ticket.getType(), request.getCategoryName());

        // one history row per field that really changed (equal values write nothing)
        Long actorId = actor.id();
        historyService.recordFieldChange(id, actorId, "title", ticket.getTitle(), title);
        historyService.recordFieldChange(id, actorId, "description", ticket.getDescription(), description);
        historyService.recordFieldChange(id, actorId, "category",
                categoryName(ticket.getCategoryId()), categoryName(newCategoryId));
        historyService.recordFieldChange(id, actorId, "priority",
                ticket.getPriority().name(), request.getPriority().name());
        historyService.recordFieldChange(id, actorId, "visibility",
                ticket.getVisibility().name(), visibility.name());

        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setCategoryId(newCategoryId);
        ticket.setPriority(request.getPriority());
        ticket.setVisibility(visibility);

        // flush now so the new version number is in the answer
        Ticket saved = ticketRepository.saveAndFlush(ticket);
        return toResponse(saved, actor);
    }

    // ---------- helpers ----------

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private Ticket findViewable(Long id, TicketActor actor) {
        Ticket ticket = findTicket(id);
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        return ticket;
    }

    private Long resolveCategoryId(TicketType type, String categoryName) {
        if (!rules.needsCategory(type)) {
            return null;
        }
        if (categoryName == null || categoryName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required");
        }
        try {
            return categoryService.findOrCreate(type, categoryName).getId();
        } catch (DataIntegrityViolationException e) {
            // two users created the same new category at the same moment. use the one that won
            String normalized = categoryName.trim().replaceAll("\\s+", " ");
            return categoryRepository.findByTicketTypeAndNameIgnoreCase(type, normalized)
                    .map(TicketCategory::getId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "Could not save the category. Try again"));
        }
    }

    private String categoryName(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId).map(TicketCategory::getName).orElse(null);
    }

    private String clean(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Pageable pageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        Sort sort = Sort.by(Sort.Direction.DESC, "createdOn").and(Sort.by(Sort.Direction.DESC, "id"));
        return PageRequest.of(safePage, safeSize, sort);
    }

    private PageResponse<TicketListItemDto> toPage(Page<Ticket> page) {
        Names names = loadNames(page.getContent());
        return PageResponse.of(page, t -> mapper.toListItem(t, names));
    }

    private TicketResponseDto toResponse(Ticket ticket, TicketActor actor) {
        Names names = loadNames(List.of(ticket));
        TicketResponseDto dto = mapper.toResponse(ticket, names, rules.canEdit(ticket, actor.id()));
        dto.setCanTriage(rules.canTriage(ticket, actor.admin()));
        return dto;
    }

    private Map<Long, String> userNames(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));
    }

    // names for every id used by these tickets, in 3 queries
    private Names loadNames(Collection<Ticket> tickets) {
        Set<Long> userIds = new HashSet<>();
        Set<Long> categoryIds = new HashSet<>();
        Set<Long> departmentIds = new HashSet<>();
        for (Ticket t : tickets) {
            userIds.add(t.getAuthorId());
            if (t.getAssigneeId() != null) userIds.add(t.getAssigneeId());
            if (t.getCategoryId() != null) categoryIds.add(t.getCategoryId());
            if (t.getDepartmentId() != null) departmentIds.add(t.getDepartmentId());
        }

        Map<Long, String> categories = categoryIds.isEmpty() ? Map.of()
                : categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(TicketCategory::getId, TicketCategory::getName, (a, b) -> a));

        Map<Long, String> departments = departmentIds.isEmpty() ? Map.of()
                : departmentRepository.findAllById(departmentIds).stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        return new Names(userNames(userIds), categories, departments);
    }
}