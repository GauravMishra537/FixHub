package com.fixhub.resource.service.impl;

import com.fixhub.resource.dto.ApproverDto;
import com.fixhub.resource.dto.CategoryDto;
import com.fixhub.resource.dto.CategoryRequestDto;
import com.fixhub.resource.dto.ItemDto;
import com.fixhub.resource.dto.ItemRequestDto;
import com.fixhub.resource.dto.MemberDto;
import com.fixhub.resource.entity.ItemKind;
import com.fixhub.resource.entity.RequestStatus;
import com.fixhub.resource.entity.ResourceApprover;
import com.fixhub.resource.entity.ResourceCategory;
import com.fixhub.resource.entity.ResourceItem;
import com.fixhub.resource.repository.HeldRow;
import com.fixhub.resource.repository.ResourceApproverRepository;
import com.fixhub.resource.repository.ResourceCategoryRepository;
import com.fixhub.resource.repository.ResourceItemRepository;
import com.fixhub.resource.repository.ResourceMemberRepository;
import com.fixhub.resource.repository.ResourceRequestRepository;
import com.fixhub.resource.service.ResourceCatalogService;
import com.fixhub.user.entity.Department;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.DepartmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ResourceCatalogServiceImpl implements ResourceCatalogService {

    private static final int MAX_CATEGORY_NAME = 100;
    private static final int MAX_ITEM_NAME = 150;
    private static final int MAX_TEXT = 255;
    private static final int MAX_ICON = 40;
    private static final int MAX_SORT = 1000;
    private static final int MAX_STOCK = 100_000;
    private static final int MAX_PER_REQUEST = 1000;
    // an item with a request in these statuses is still in use
    private static final List<RequestStatus> OPEN =
            List.of(RequestStatus.PENDING_DEPT, RequestStatus.PENDING_ADMIN, RequestStatus.APPROVED);

    private final ResourceCategoryRepository categoryRepository;
    private final ResourceItemRepository itemRepository;
    private final ResourceRequestRepository requestRepository;
    private final ResourceApproverRepository approverRepository;
    private final DepartmentRepository departmentRepository;
    private final ResourceMemberRepository memberRepository;

    public ResourceCatalogServiceImpl(ResourceCategoryRepository categoryRepository,
                                      ResourceItemRepository itemRepository,
                                      ResourceRequestRepository requestRepository,
                                      ResourceApproverRepository approverRepository,
                                      DepartmentRepository departmentRepository,
                                      ResourceMemberRepository memberRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.requestRepository = requestRepository;
        this.approverRepository = approverRepository;
        this.departmentRepository = departmentRepository;
        this.memberRepository = memberRepository;
    }

    // ---------- categories ----------

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories() {
        Lookup l = lookup();
        List<CategoryDto> out = new ArrayList<>();
        for (ResourceCategory group : categoryRepository.findByParentIdIsNullOrderBySortOrderAscNameAsc()) {
            out.add(categoryDto(group, l));
            for (ResourceCategory sub : categoryRepository.findByParentIdOrderBySortOrderAscNameAsc(group.getId())) {
                out.add(categoryDto(sub, l));
            }
        }
        return out;
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryRequestDto request) {
        if (request == null) {
            throw bad("Category details are required");
        }
        String name = checkName(request.name(), MAX_CATEGORY_NAME);
        Long parentId = request.parentId();
        if (parentId != null) {
            ResourceCategory parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
            if (parent.getParentId() != null) {
                throw bad("A sub-category goes under a group, not under another sub-category");
            }
        }
        if (categoryNameTaken(parentId, name, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This name is already used here");
        }
        checkDepartment(request.departmentId());

        ResourceCategory c = new ResourceCategory();
        c.setName(name);
        c.setParentId(parentId);
        c.setIcon(checkIcon(request.icon()));
        c.setSortOrder(checkSort(request.sortOrder()));
        c.setActive(request.active() == null || request.active());
        c.setDepartmentId(request.departmentId());
        c = categoryRepository.saveAndFlush(c);
        return categoryDto(c, lookup());
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequestDto request) {
        if (request == null) {
            throw bad("Category details are required");
        }
        ResourceCategory c = findCategory(id);
        String name = checkName(request.name(), MAX_CATEGORY_NAME);
        if (categoryNameTaken(c.getParentId(), name, c.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This name is already used here");
        }
        checkDepartment(request.departmentId());

        c.setName(name);
        c.setIcon(checkIcon(request.icon()));
        c.setSortOrder(checkSort(request.sortOrder()));
        c.setActive(request.active() == null || request.active());
        c.setDepartmentId(request.departmentId());
        c = categoryRepository.saveAndFlush(c);
        return categoryDto(c, lookup());
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        ResourceCategory c = findCategory(id);
        if (categoryRepository.existsByParentId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Remove its sub-categories first");
        }
        if (itemRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Remove its items first");
        }
        categoryRepository.delete(c);
    }

    // ---------- items ----------

    @Override
    @Transactional(readOnly = true)
    public List<ItemDto> listItems(Long categoryId) {
        findCategory(categoryId);
        List<ResourceItem> items = itemRepository.findByCategoryIdOrderByNameAsc(categoryId);
        return itemDtos(items);
    }

    @Override
    @Transactional
    public ItemDto createItem(ItemRequestDto request) {
        if (request == null) {
            throw bad("Item details are required");
        }
        if (request.categoryId() == null) {
            throw bad("Choose a sub-category");
        }
        ResourceCategory category = findCategory(request.categoryId());
        if (category.getParentId() == null) {
            throw bad("Add items under a sub-category, not under a group");
        }
        String name = checkName(request.name(), MAX_ITEM_NAME);
        if (itemRepository.existsByCategoryIdAndNameIgnoreCase(category.getId(), name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This item already exists here");
        }
        ItemKind kind = checkKind(request.kind());

        ResourceItem item = new ResourceItem();
        item.setCategoryId(category.getId());
        item.setName(name);
        item.setDescription(checkDescription(request.description()));
        item.setKind(kind);
        item.setTotalStock(stockFor(kind, request.totalStock()));
        item.setMaxPerRequest(checkMax(request.maxPerRequest()));
        item.setActive(request.active() == null || request.active());
        item = itemRepository.saveAndFlush(item);
        return itemDtos(List.of(item)).get(0);
    }

    @Override
    @Transactional
    public ItemDto updateItem(Long id, ItemRequestDto request) {
        if (request == null) {
            throw bad("Item details are required");
        }
        // lock the row: no request can take stock while the admin changes it
        ResourceItem item = itemRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        String name = checkName(request.name(), MAX_ITEM_NAME);
        Long itemId = item.getId();
        boolean nameTaken = itemRepository.findByCategoryIdOrderByNameAsc(item.getCategoryId()).stream()
                .anyMatch(x -> x.getName().equalsIgnoreCase(name) && !x.getId().equals(itemId));
        if (nameTaken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This item already exists here");
        }
        ItemKind kind = checkKind(request.kind());
        long held = requestRepository.heldQuantity(item.getId());
        if (kind != item.getKind() && held > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    held + " are held by requests. The kind cannot change now");
        }
        Integer stock = stockFor(kind, request.totalStock());
        if (kind == ItemKind.PHYSICAL && stock < held) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    held + " are held by requests. Stock cannot go below that");
        }

        item.setName(name);
        item.setDescription(checkDescription(request.description()));
        item.setKind(kind);
        item.setTotalStock(stock);
        item.setMaxPerRequest(checkMax(request.maxPerRequest()));
        item.setActive(request.active() == null || request.active());
        item = itemRepository.saveAndFlush(item);
        return itemDtos(List.of(item)).get(0);
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        ResourceItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (requestRepository.existsByItemIdAndStatusIn(id, OPEN)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Open requests use this item. Hide it instead, or wait until they are done");
        }
        itemRepository.delete(item);
    }

    // ---------- approvers ----------

    @Override
    @Transactional(readOnly = true)
    public List<ApproverDto> listApprovers() {
        Map<Long, ResourceApprover> byDepartment = approverRepository.findAll().stream()
                .collect(Collectors.toMap(ResourceApprover::getDepartmentId, Function.identity(), (a, b) -> a));
        Map<Long, User> users = memberRepository
                .findByIdIn(byDepartment.values().stream().map(ResourceApprover::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, List<String>> owns = categoryRepository.findAll().stream()
                .filter(c -> c.getDepartmentId() != null)
                .collect(Collectors.groupingBy(ResourceCategory::getDepartmentId,
                        Collectors.mapping(ResourceCategory::getName, Collectors.toList())));

        return departmentRepository.findAllByOrderByNameAsc().stream().map(d -> {
            ResourceApprover a = byDepartment.get(d.getId());
            User u = a == null ? null : users.get(a.getUserId());
            return new ApproverDto(d.getId(), d.getName(),
                    u == null ? null : u.getId(), u == null ? null : u.getFullName(),
                    owns.getOrDefault(d.getId(), List.of()));
        }).toList();
    }

    @Override
    @Transactional
    public ApproverDto setApprover(Long departmentId, Long userId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        if (userId == null) {
            throw bad("Choose a person");
        }
        User user = memberRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found"));
        if (!department.getId().equals(user.getDepartmentId())) {
            throw bad(user.getFullName() + " is not in " + department.getName());
        }
        ResourceApprover approver = approverRepository.findByDepartmentId(departmentId).orElseGet(() -> {
            ResourceApprover x = new ResourceApprover();
            x.setDepartmentId(departmentId);
            return x;
        });
        approver.setUserId(userId);
        approverRepository.saveAndFlush(approver);
        return listApprovers().stream()
                .filter(a -> a.departmentId().equals(departmentId))
                .findFirst()
                .orElseThrow();
    }

    @Override
    @Transactional
    public void clearApprover(Long departmentId) {
        approverRepository.findByDepartmentId(departmentId).ifPresent(approverRepository::delete);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberDto> listMembers(Long departmentId) {
        departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        return memberRepository.findByDepartmentIdOrderByFullNameAsc(departmentId).stream()
                .map(u -> new MemberDto(u.getId(), u.getFullName(), u.getEmail(), u.getDesignation()))
                .toList();
    }

    // ---------- helpers ----------

    // everything the category rows need, read once
    private record Lookup(Map<Long, ResourceCategory> byId,
                          Map<Long, String> departments,
                          Map<Long, Long> itemCounts,
                          Map<Long, Long> subCounts) {
    }

    private Lookup lookup() {
        List<ResourceCategory> all = categoryRepository.findAll();
        Map<Long, ResourceCategory> byId = all.stream()
                .collect(Collectors.toMap(ResourceCategory::getId, Function.identity()));
        Map<Long, String> departments = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));
        Map<Long, Long> itemCounts = itemRepository.findAll().stream()
                .collect(Collectors.groupingBy(ResourceItem::getCategoryId, Collectors.counting()));
        Map<Long, Long> subCounts = all.stream()
                .filter(c -> c.getParentId() != null)
                .collect(Collectors.groupingBy(ResourceCategory::getParentId, Collectors.counting()));
        return new Lookup(byId, departments, itemCounts, subCounts);
    }

    private CategoryDto categoryDto(ResourceCategory c, Lookup l) {
        Long effective = c.getDepartmentId();
        if (effective == null && c.getParentId() != null) {
            ResourceCategory parent = l.byId().get(c.getParentId());
            effective = parent == null ? null : parent.getDepartmentId();
        }
        return new CategoryDto(c.getId(), c.getName(), c.getParentId(), c.getIcon(), c.getSortOrder(),
                c.isActive(), c.getDepartmentId(), effective,
                effective == null ? null : l.departments().get(effective),
                l.subCounts().getOrDefault(c.getId(), 0L),
                l.itemCounts().getOrDefault(c.getId(), 0L));
    }

    private List<ItemDto> itemDtos(List<ResourceItem> items) {
        if (items.isEmpty()) {
            return List.of();
        }
        Map<Long, Long> held = requestRepository
                .heldQuantities(items.stream().map(ResourceItem::getId).toList())
                .stream().collect(Collectors.toMap(HeldRow::getItemId, HeldRow::getHeld));
        return items.stream().map(i -> {
            boolean physical = i.getKind() == ItemKind.PHYSICAL;
            long h = held.getOrDefault(i.getId(), 0L);
            return new ItemDto(i.getId(), i.getCategoryId(), i.getName(), i.getDescription(), i.getKind(),
                    i.getTotalStock(), physical ? h : null,
                    physical ? i.getTotalStock() - h : null,
                    i.getMaxPerRequest(), i.isActive());
        }).toList();
    }

    private ResourceCategory findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    // same name among siblings. exceptId: the category being edited
    private boolean categoryNameTaken(Long parentId, String name, Long exceptId) {
        List<ResourceCategory> siblings = parentId == null
                ? categoryRepository.findByParentIdIsNullOrderBySortOrderAscNameAsc()
                : categoryRepository.findByParentIdOrderBySortOrderAscNameAsc(parentId);
        return siblings.stream()
                .anyMatch(s -> s.getName().equalsIgnoreCase(name) && !s.getId().equals(exceptId));
    }

    private void checkDepartment(Long departmentId) {
        if (departmentId != null && !departmentRepository.existsById(departmentId)) {
            throw bad("Department not found");
        }
    }

    private String checkName(String raw, int max) {
        String name = clean(raw);
        if (name.isEmpty()) {
            throw bad("Name is required");
        }
        if (name.length() > max) {
            throw bad("Name cannot exceed " + max + " characters");
        }
        return name;
    }

    private String checkDescription(String raw) {
        String text = clean(raw);
        if (text.length() > MAX_TEXT) {
            throw bad("Description cannot exceed " + MAX_TEXT + " characters");
        }
        return text.isEmpty() ? null : text;
    }

    private String checkIcon(String raw) {
        String icon = clean(raw);
        if (icon.length() > MAX_ICON) {
            throw bad("Icon cannot exceed " + MAX_ICON + " characters");
        }
        return icon.isEmpty() ? null : icon;
    }

    private int checkSort(Integer sort) {
        int value = sort == null ? 0 : sort;
        if (value < 0 || value > MAX_SORT) {
            throw bad("Order must be between 0 and " + MAX_SORT);
        }
        return value;
    }

    private ItemKind checkKind(ItemKind kind) {
        if (kind == null) {
            throw bad("Choose physical or digital");
        }
        return kind;
    }

    // PHYSICAL needs a stock number. DIGITAL has none
    private Integer stockFor(ItemKind kind, Integer stock) {
        if (kind == ItemKind.DIGITAL) {
            return null;
        }
        if (stock == null) {
            throw bad("Enter how many are in stock");
        }
        if (stock < 0 || stock > MAX_STOCK) {
            throw bad("Stock must be between 0 and " + MAX_STOCK);
        }
        return stock;
    }

    private int checkMax(Integer max) {
        int value = max == null ? 1 : max;
        if (value < 1 || value > MAX_PER_REQUEST) {
            throw bad("Most per request must be between 1 and " + MAX_PER_REQUEST);
        }
        return value;
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}