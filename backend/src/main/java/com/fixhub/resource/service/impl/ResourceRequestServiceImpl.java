package com.fixhub.resource.service.impl;

import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.resource.dto.ResourceRequestDto;
import com.fixhub.resource.dto.ResourceRequestResultDto;
import com.fixhub.resource.entity.RequestStatus;
import com.fixhub.resource.entity.ResourceApprover;
import com.fixhub.resource.entity.ResourceCategory;
import com.fixhub.resource.entity.ResourceItem;
import com.fixhub.resource.entity.ResourceRequest;
import com.fixhub.resource.repository.ResourceApproverRepository;
import com.fixhub.resource.repository.ResourceCategoryRepository;
import com.fixhub.resource.repository.ResourceItemRepository;
import com.fixhub.resource.repository.ResourceRequestRepository;
import com.fixhub.resource.repository.ResourceTicketCategoryRepository;
import com.fixhub.resource.service.ResourceRequestService;
import com.fixhub.resource.service.ResourceStockService;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.entity.TicketVisibility;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketCategoryService;
import com.fixhub.ticket.service.TicketNumberService;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.resource.dto.ResourceSettingsDto;
import com.fixhub.resource.dto.ResourceSettingsRequestDto;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class ResourceRequestServiceImpl implements ResourceRequestService {

    private static final int MAX_REASON = 500;
    private static final int MAX_DAYS_AHEAD = 365;
    private static final int MAX_MESSAGE = 255;

    private final ResourceItemRepository itemRepository;
    private final ResourceCategoryRepository categoryRepository;
    private final ResourceApproverRepository approverRepository;
    private final ResourceRequestRepository requestRepository;
    private final ResourceTicketCategoryRepository ticketCategoryRepository;
    private final ResourceStockService stockService;
    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketNumberService ticketNumberService;
    private final TicketCategoryService categoryService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ResourceRequestServiceImpl(ResourceItemRepository itemRepository,
                                      ResourceCategoryRepository categoryRepository,
                                      ResourceApproverRepository approverRepository,
                                      ResourceRequestRepository requestRepository,
                                      ResourceTicketCategoryRepository ticketCategoryRepository,
                                      ResourceStockService stockService,
                                      TicketRepository ticketRepository,
                                      TicketHistoryRepository historyRepository,
                                      TicketNumberService ticketNumberService,
                                      TicketCategoryService categoryService,
                                      UserRepository userRepository,
                                      NotificationService notificationService) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.approverRepository = approverRepository;
        this.requestRepository = requestRepository;
        this.ticketCategoryRepository = ticketCategoryRepository;
        this.stockService = stockService;
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.ticketNumberService = ticketNumberService;
        this.categoryService = categoryService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public ResourceRequestResultDto create(ResourceRequestDto request, TicketActor actor) {
        if (request == null) {
            throw bad("Request details are required");
        }
        if (request.itemId() == null) {
            throw bad("Choose what you want");
        }
        int quantity = request.quantity() == null ? 0 : request.quantity();
        if (quantity < 1) {
            throw bad("Quantity must be at least 1");
        }
        String reason = clean(request.reason());
        if (reason.isEmpty()) {
            throw bad("Tell why you need it");
        }
        if (reason.length() > MAX_REASON) {
            throw bad("Reason cannot exceed " + MAX_REASON + " characters");
        }
        LocalDate neededBy = request.neededBy();
        if (neededBy != null) {
            LocalDate today = LocalDate.now();
            if (neededBy.isBefore(today)) {
                throw bad("The needed-by date is in the past");
            }
            if (neededBy.isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
                throw bad("The needed-by date can be at most " + MAX_DAYS_AHEAD + " days ahead");
            }
        }

        // lock the item row first: two people asking for the last one are served one after the other
        ResourceItem item = itemRepository.findByIdForUpdate(request.itemId())
                .filter(ResourceItem::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This item is not available"));
        ResourceCategory sub = categoryRepository.findById(item.getCategoryId())
                .filter(ResourceCategory::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This item is not available"));
        ResourceCategory group = sub.getParentId() == null
                ? sub
                : categoryRepository.findById(sub.getParentId())
                        .filter(ResourceCategory::isActive)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "This item is not available"));

        if (quantity > item.getMaxPerRequest()) {
            throw bad("You can ask for at most " + item.getMaxPerRequest() + " at a time");
        }
        stockService.require(item, quantity);

        // who decides first: the department's person, found through the category. none, or the requester: an admin
        Long departmentId = sub.getDepartmentId() != null ? sub.getDepartmentId() : group.getDepartmentId();
        Long approverId = departmentId == null
                ? null
                : approverRepository.findByDepartmentId(departmentId)
                        .map(ResourceApprover::getUserId)
                        .filter(userRepository::existsById)
                        .orElse(null);
        boolean skipDepartment = approverId == null || approverId.equals(actor.id());
        String skipNote = approverId == null
                ? "No department approver is set. Sent to an admin"
                : "You are the department approver. Sent to an admin";

        String title = item.getName() + (quantity > 1 ? " x" + quantity : "");

        Ticket ticket = new Ticket();
        ticket.setType(TicketType.RESOURCE_REQUEST);
        ticket.setTicketNo(ticketNumberService.nextTicketNo());
        ticket.setTitle(title);
        ticket.setDescription(reason);
        ticket.setStatus(skipDepartment ? TicketStatus.DEPT_APPROVED : TicketStatus.PENDING_APPROVAL);
        ticket.setPriority(request.priority() == null ? TicketPriority.MEDIUM : request.priority());
        ticket.setVisibility(request.visibility() == null ? TicketVisibility.PRIVATE : request.visibility());
        ticket.setAuthorId(actor.id());
        ticket.setDepartmentId(departmentId);
        // the approver is the assignee while the department decides: that is how a private ticket reaches them
        ticket.setAssigneeId(skipDepartment ? null : approverId);
        ticket.setCategoryId(categoryIdFor(sub.getName()));
        ticket = ticketRepository.saveAndFlush(ticket);

        ResourceRequest row = new ResourceRequest();
        row.setTicketId(ticket.getId());
        row.setItemId(item.getId());
        row.setQuantity(quantity);
        row.setReason(reason);
        row.setNeededBy(neededBy);
        row.setStatus(skipDepartment ? RequestStatus.PENDING_ADMIN : RequestStatus.PENDING_DEPT);
        row.setHolding(true);
        row.setDeptApproverId(skipDepartment ? null : approverId);
        if (skipDepartment) {
            row.setDeptDecidedOn(Instant.now());
            row.setDeptNote(skipNote);
        }
        requestRepository.saveAndFlush(row);

        TicketHistory created = new TicketHistory();
        created.setTicketId(ticket.getId());
        created.setActorId(actor.id());
        created.setAction(HistoryAction.CREATED);
        created.setNote("Requested " + title + (skipDepartment ? ". " + skipNote : ""));
        historyRepository.save(created);

        String who = userName(actor.id());
        if (skipDepartment) {
            tellAdmins(actor.id(), NotificationType.RESOURCE_DEPT_APPROVED, ticket.getId(),
                    who + " requested " + title + " (" + ticket.getTicketNo() + "). It needs your approval");
        } else {
            tell(approverId, NotificationType.RESOURCE_APPROVAL_NEEDED, ticket.getId(),
                    who + " requested " + title + " (" + ticket.getTicketNo() + "). It needs your approval");
        }

        return new ResourceRequestResultDto(ticket.getId(), ticket.getTicketNo(), ticket.getTitle(),
                ticket.getStatus());
    }

        // ---------- priority and visibility ----------

    @Override
    @Transactional
    public ResourceSettingsDto updateSettings(Long ticketId, ResourceSettingsRequestDto request, TicketActor actor) {
        if (request == null || (request.priority() == null && request.visibility() == null)) {
            throw bad("Choose a priority or a visibility");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (ticket.getType() != TicketType.RESOURCE_REQUEST) {
            throw bad("This is not a resource request");
        }
        if (!actor.admin() && !ticket.getAuthorId().equals(actor.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author or an admin can change this");
        }
        TicketStatus s = ticket.getStatus();
        if (s != TicketStatus.PENDING_APPROVAL && s != TicketStatus.DEPT_APPROVED && s != TicketStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is finished and cannot be changed");
        }
        if (request.version() != null && !request.version().equals(ticket.getVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This ticket changed while you were looking. Reload and try again");
        }

        TicketPriority oldPriority = ticket.getPriority();
        TicketVisibility oldVisibility = ticket.getVisibility();
        boolean priorityChanged = request.priority() != null && request.priority() != oldPriority;
        boolean visibilityChanged = request.visibility() != null && request.visibility() != oldVisibility;
        if (!priorityChanged && !visibilityChanged) {
            return new ResourceSettingsDto(oldPriority, oldVisibility, ticket.getVersion());
        }
        if (priorityChanged) {
            ticket.setPriority(request.priority());
        }
        if (visibilityChanged) {
            ticket.setVisibility(request.visibility());
        }
        ticket = ticketRepository.saveAndFlush(ticket);

        if (priorityChanged) {
            logSetting(ticketId, actor.id(), "priority", oldPriority.name(), request.priority().name());
        }
        if (visibilityChanged) {
            logSetting(ticketId, actor.id(), "visibility", oldVisibility.name(), request.visibility().name());
        }
        return new ResourceSettingsDto(ticket.getPriority(), ticket.getVisibility(), ticket.getVersion());
    }

    private void logSetting(Long ticketId, Long actorId, String field, String from, String to) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actorId);
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName(field);
        row.setFromValue(from);
        row.setToValue(to);
        historyRepository.save(row);
    }

    // the card chip shows the sub-category. find it, or let the category service make it
    private Long categoryIdFor(String name) {
        return ticketCategoryRepository.findFirstByTicketTypeAndNameIgnoreCase(TicketType.RESOURCE_REQUEST, name)
                .map(TicketCategory::getId)
                .orElseGet(() -> {
                    categoryService.findOrCreate(TicketType.RESOURCE_REQUEST, name);
                    return ticketCategoryRepository
                            .findFirstByTicketTypeAndNameIgnoreCase(TicketType.RESOURCE_REQUEST, name)
                            .map(TicketCategory::getId)
                            .orElse(null);
                });
    }

    private void tellAdmins(Long actorId, NotificationType type, Long ticketId, String message) {
        List<Long> admins = userRepository.findIdsByRole(Role.ADMIN).stream()
                .filter(id -> !id.equals(actorId))
                .toList();
        if (!admins.isEmpty()) {
            notificationService.notifyUsers(admins, type, ticketId, cut(message));
        }
    }

    private void tell(Long userId, NotificationType type, Long ticketId, String message) {
        if (userId != null) {
            notificationService.notifyUsers(List.of(userId), type, ticketId, cut(message));
        }
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static String cut(String s) {
        return s.length() > MAX_MESSAGE ? s.substring(0, MAX_MESSAGE) : s;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}