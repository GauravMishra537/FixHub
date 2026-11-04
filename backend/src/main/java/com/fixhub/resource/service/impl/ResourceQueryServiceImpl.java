package com.fixhub.resource.service.impl;

import com.fixhub.resource.dto.CatalogCategoryDto;
import com.fixhub.resource.dto.CatalogGroupDto;
import com.fixhub.resource.dto.CatalogItemDto;
import com.fixhub.resource.dto.ResourceApprovalDto;
import com.fixhub.resource.dto.ResourceRequestDetailDto;
import com.fixhub.resource.entity.ItemKind;
import com.fixhub.resource.entity.RequestStatus;
import com.fixhub.resource.entity.ResourceCategory;
import com.fixhub.resource.entity.ResourceItem;
import com.fixhub.resource.entity.ResourceRequest;
import com.fixhub.resource.repository.HeldRow;
import com.fixhub.resource.repository.ResourceCategoryRepository;
import com.fixhub.resource.repository.ResourceItemRepository;
import com.fixhub.resource.repository.ResourceRequestRepository;
import com.fixhub.resource.service.ResourceQueryService;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.user.entity.Department;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.DepartmentRepository;
import com.fixhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ResourceQueryServiceImpl implements ResourceQueryService {

    private final ResourceCategoryRepository categoryRepository;
    private final ResourceItemRepository itemRepository;
    private final ResourceRequestRepository requestRepository;
    private final TicketRepository ticketRepository;
    private final TicketRules rules;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public ResourceQueryServiceImpl(ResourceCategoryRepository categoryRepository,
                                    ResourceItemRepository itemRepository,
                                    ResourceRequestRepository requestRepository,
                                    TicketRepository ticketRepository,
                                    TicketRules rules,
                                    UserRepository userRepository,
                                    DepartmentRepository departmentRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.requestRepository = requestRepository;
        this.ticketRepository = ticketRepository;
        this.rules = rules;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    // ---------- catalog ----------

    @Override
    @Transactional(readOnly = true)
    public List<CatalogGroupDto> catalog() {
        List<ResourceCategory> groups = categoryRepository.findByParentIdIsNullOrderBySortOrderAscNameAsc()
                .stream().filter(ResourceCategory::isActive).toList();
        Map<Long, ResourceCategory> groupById = groups.stream()
                .collect(Collectors.toMap(ResourceCategory::getId, Function.identity()));
        List<ResourceCategory> subs = categoryRepository.findByParentIdIsNotNullOrderBySortOrderAscNameAsc()
                .stream()
                .filter(ResourceCategory::isActive)
                .filter(s -> groupById.containsKey(s.getParentId()))
                .toList();
        if (subs.isEmpty()) {
            return List.of();
        }

        List<ResourceItem> items = itemRepository
                .findByCategoryIdInOrderByNameAsc(subs.stream().map(ResourceCategory::getId).toList())
                .stream().filter(ResourceItem::isActive).toList();
        Map<Long, Long> held = items.isEmpty()
                ? Map.of()
                : requestRepository.heldQuantities(items.stream().map(ResourceItem::getId).toList())
                        .stream().collect(Collectors.toMap(HeldRow::getItemId, HeldRow::getHeld));
        Map<Long, List<ResourceItem>> itemsBySub = items.stream()
                .collect(Collectors.groupingBy(ResourceItem::getCategoryId));
        Map<Long, String> departments = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));

        List<CatalogGroupDto> out = new ArrayList<>();
        for (ResourceCategory group : groups) {
            List<CatalogCategoryDto> categories = new ArrayList<>();
            for (ResourceCategory sub : subs) {
                if (!sub.getParentId().equals(group.getId())) {
                    continue;
                }
                List<ResourceItem> mine = itemsBySub.getOrDefault(sub.getId(), List.of());
                if (mine.isEmpty()) {
                    continue;
                }
                Long departmentId = sub.getDepartmentId() != null ? sub.getDepartmentId() : group.getDepartmentId();
                categories.add(new CatalogCategoryDto(sub.getId(), sub.getName(),
                        departmentId == null ? null : departments.get(departmentId),
                        mine.stream().map(i -> catalogItem(i, held)).toList()));
            }
            if (!categories.isEmpty()) {
                out.add(new CatalogGroupDto(group.getId(), group.getName(), group.getIcon(), categories));
            }
        }
        return out;
    }

    private CatalogItemDto catalogItem(ResourceItem i, Map<Long, Long> held) {
        Long available = null;
        if (i.getKind() == ItemKind.PHYSICAL && i.getTotalStock() != null) {
            available = Math.max(0L, i.getTotalStock() - held.getOrDefault(i.getId(), 0L));
        }
        return new CatalogItemDto(i.getId(), i.getName(), i.getDescription(), i.getKind(), available,
                i.getMaxPerRequest());
    }

    // ---------- one request ----------

    @Override
    @Transactional(readOnly = true)
    public ResourceRequestDetailDto details(Long ticketId, TicketActor actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        if (ticket.getType() != TicketType.RESOURCE_REQUEST) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This is not a resource request");
        }
        ResourceRequest r = requestRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request details not found"));

        ResourceItem item = itemRepository.findById(r.getItemId()).orElse(null);
        ResourceCategory sub = item == null ? null : categoryRepository.findById(item.getCategoryId()).orElse(null);
        ResourceCategory group = sub == null || sub.getParentId() == null
                ? sub
                : categoryRepository.findById(sub.getParentId()).orElse(null);
        String departmentName = ticket.getDepartmentId() == null
                ? null
                : departmentRepository.findById(ticket.getDepartmentId()).map(Department::getName).orElse(null);

        return new ResourceRequestDetailDto(
                ticketId, ticket.getTicketNo(), r.getItemId(),
                item == null ? null : item.getName(),
                item == null ? null : item.getKind(),
                sub == null ? null : sub.getName(),
                group == null ? null : group.getName(),
                r.getQuantity(), r.getReason(), r.getNeededBy(), r.getStatus(), r.isHolding(),
                departmentName,
                r.getDeptApproverId(), nameOf(r.getDeptApproverId()),
                nameOf(r.getDeptDecidedBy()), r.getDeptDecidedOn(), r.getDeptNote(),
                nameOf(r.getAdminDecidedBy()), r.getAdminDecidedOn(), r.getAdminNote());
    }

    // ---------- waiting for me ----------

    @Override
    @Transactional(readOnly = true)
    public List<ResourceApprovalDto> approvals(TicketActor actor) {
        List<ResourceRequest> waiting = requestRepository
                .findByDeptApproverIdAndStatusOrderByCreatedOnAsc(actor.id(), RequestStatus.PENDING_DEPT);
        if (waiting.isEmpty()) {
            return List.of();
        }
        Map<Long, Ticket> tickets = ticketRepository
                .findAllById(waiting.stream().map(ResourceRequest::getTicketId).toList())
                .stream().collect(Collectors.toMap(Ticket::getId, Function.identity()));
        Map<Long, ResourceItem> items = itemRepository
                .findAllById(waiting.stream().map(ResourceRequest::getItemId).toList())
                .stream().collect(Collectors.toMap(ResourceItem::getId, Function.identity()));
        Map<Long, String> authors = userRepository
                .findAllById(tickets.values().stream().map(Ticket::getAuthorId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, User::getFullName));

        List<ResourceApprovalDto> out = new ArrayList<>();
        for (ResourceRequest r : waiting) {
            Ticket t = tickets.get(r.getTicketId());
            // a removed ticket, or one that already moved on, is not waiting for anyone
            if (t == null || t.getStatus() != TicketStatus.PENDING_APPROVAL) {
                continue;
            }
            ResourceItem item = items.get(r.getItemId());
            out.add(new ResourceApprovalDto(t.getId(), t.getTicketNo(), t.getTitle(), t.getPriority(),
                    t.getVersion(), authors.getOrDefault(t.getAuthorId(), "#" + t.getAuthorId()),
                    item == null ? null : item.getName(), r.getQuantity(), r.getReason(), r.getNeededBy(),
                    r.getCreatedOn()));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public long approvalCount(TicketActor actor) {
        return requestRepository.countByDeptApproverIdAndStatus(actor.id(), RequestStatus.PENDING_DEPT);
    }

    private String nameOf(Long userId) {
        return userId == null ? null : userRepository.findById(userId).map(User::getFullName).orElse(null);
    }
}