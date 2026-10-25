package com.fixhub.ticket.service.impl;

import com.fixhub.ticket.dto.RoutingRuleRequestDto;
import com.fixhub.ticket.dto.RoutingRuleResponseDto;
import com.fixhub.ticket.entity.RoutingRule;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.repository.RoutingRuleRepository;
import com.fixhub.ticket.repository.TicketCategoryRepository;
import com.fixhub.ticket.service.RoutingRuleService;
import com.fixhub.user.entity.Department;
import com.fixhub.user.repository.DepartmentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoutingRuleServiceImpl implements RoutingRuleService {

    private final RoutingRuleRepository ruleRepository;
    private final DepartmentRepository departmentRepository;
    private final TicketCategoryRepository categoryRepository;

    public RoutingRuleServiceImpl(RoutingRuleRepository ruleRepository,
                                  DepartmentRepository departmentRepository,
                                  TicketCategoryRepository categoryRepository) {
        this.ruleRepository = ruleRepository;
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoutingRuleResponseDto> list() {
        List<RoutingRule> rules = ruleRepository.findAll(Sort.by("ticketType", "id"));
        Names names = loadNames(rules);
        return rules.stream()
                .map(r -> toDto(r, names))
                .sorted(Comparator.comparing(RoutingRuleResponseDto::ticketType)
                        .thenComparing(RoutingRuleResponseDto::categoryName,
                                Comparator.nullsFirst(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @Override
    @Transactional
    public RoutingRuleResponseDto create(RoutingRuleRequestDto request) {
        validate(request, null);

        RoutingRule rule = new RoutingRule();
        apply(rule, request);
        return save(rule);
    }

    @Override
    @Transactional
    public RoutingRuleResponseDto update(Long id, RoutingRuleRequestDto request) {
        RoutingRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));
        validate(request, id);

        apply(rule, request);
        return save(rule);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        RoutingRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));
        ruleRepository.delete(rule);
    }

    // ---------- helpers ----------

    private void apply(RoutingRule rule, RoutingRuleRequestDto request) {
        rule.setTicketType(request.getTicketType());
        rule.setCategoryId(request.getCategoryId());
        rule.setDepartmentId(request.getDepartmentId());
        rule.setActive(request.getActive() == null || request.getActive());
    }

    private RoutingRuleResponseDto save(RoutingRule rule) {
        try {
            RoutingRule saved = ruleRepository.saveAndFlush(rule);
            return toDto(saved, loadNames(List.of(saved)));
        } catch (DataIntegrityViolationException e) {
            // two admins saved the same rule at the same moment
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A rule for this type and category already exists");
        }
    }

    private void validate(RoutingRuleRequestDto request, Long selfId) {
        if (!departmentRepository.existsById(request.getDepartmentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found");
        }

        Long categoryId = request.getCategoryId();
        if (categoryId != null) {
            TicketCategory category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
            if (category.getTicketType() != request.getTicketType()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This category belongs to another ticket type");
            }
        }

        Optional<RoutingRule> same = categoryId == null
                ? ruleRepository.findByTicketTypeAndCategoryIdIsNull(request.getTicketType())
                : ruleRepository.findByTicketTypeAndCategoryId(request.getTicketType(), categoryId);
        if (same.isPresent() && !Objects.equals(same.get().getId(), selfId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A rule for this type and category already exists");
        }
    }

    private record Names(Map<Long, String> departments, Map<Long, String> categories) {
    }

    private Names loadNames(List<RoutingRule> rules) {
        Set<Long> departmentIds = new HashSet<>();
        Set<Long> categoryIds = new HashSet<>();
        for (RoutingRule r : rules) {
            departmentIds.add(r.getDepartmentId());
            if (r.getCategoryId() != null) categoryIds.add(r.getCategoryId());
        }

        Map<Long, String> departments = departmentIds.isEmpty() ? Map.of()
                : departmentRepository.findAllById(departmentIds).stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        Map<Long, String> categories = categoryIds.isEmpty() ? Map.of()
                : categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(TicketCategory::getId, TicketCategory::getName, (a, b) -> a));

        return new Names(departments, categories);
    }

    private RoutingRuleResponseDto toDto(RoutingRule r, Names names) {
        return new RoutingRuleResponseDto(
                r.getId(),
                r.getTicketType(),
                r.getCategoryId(),
                r.getCategoryId() == null ? null : names.categories().get(r.getCategoryId()),
                r.getDepartmentId(),
                names.departments().get(r.getDepartmentId()),
                r.isActive());
    }
}