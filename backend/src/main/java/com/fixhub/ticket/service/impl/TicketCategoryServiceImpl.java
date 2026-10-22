package com.fixhub.ticket.service.impl;

import com.fixhub.common.audit.service.AuditRecorder;
import com.fixhub.ticket.dto.TicketCategoryRequestDto;
import com.fixhub.ticket.dto.TicketCategoryResponseDto;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.mapper.TicketCategoryMapper;
import com.fixhub.ticket.repository.TicketCategoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Propagation;
import java.util.Optional;
import java.util.List;
import java.util.Locale;

@Service
public class TicketCategoryServiceImpl implements TicketCategoryService {

    private final TicketCategoryRepository categoryRepository;
    private final TicketRepository ticketRepository;
    private final TicketCategoryMapper categoryMapper;
    private final AuditRecorder auditRecorder;

    public TicketCategoryServiceImpl(TicketCategoryRepository categoryRepository,
                                     TicketRepository ticketRepository,
                                     TicketCategoryMapper categoryMapper,
                                     AuditRecorder auditRecorder) {
        this.categoryRepository = categoryRepository;
        this.ticketRepository = ticketRepository;
        this.categoryMapper = categoryMapper;
        this.auditRecorder = auditRecorder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketCategoryResponseDto> getAll(TicketType type) {
        List<TicketCategory> list = (type == null)
                ? categoryRepository.findAllByOrderByTicketTypeAscNameAsc()
                : categoryRepository.findByTicketTypeOrderByNameAsc(type);
        return list.stream().map(categoryMapper::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketCategoryResponseDto> getActiveByType(TicketType type) {
        return categoryRepository.findByTicketTypeAndActiveTrueOrderByNameAsc(type).stream()
                .map(categoryMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public TicketCategoryResponseDto create(TicketCategoryRequestDto request) {
        String name = request.getName().trim();
        if (categoryRepository.existsByTicketTypeAndNameIgnoreCase(request.getTicketType(), name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Category already exists for " + request.getTicketType());
        }
        TicketCategory category = new TicketCategory();
        category.setTicketType(request.getTicketType());
        category.setName(name);
        category.setActive(request.getActive() == null || request.getActive());
        TicketCategory saved = categoryRepository.save(category);
        auditRecorder.record("TICKET_CATEGORY_CREATED",
                "Category created: " + saved.getName() + " (" + saved.getTicketType() + ")");
        return categoryMapper.toDto(saved);
    }

    @Override
    @Transactional
    public TicketCategoryResponseDto update(Long id, TicketCategoryRequestDto request) {
        TicketCategory category = findById(id);
        if (request.getTicketType() != category.getTicketType()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category type cannot be changed");
        }
        String name = request.getName().trim();
        if (categoryRepository.existsByTicketTypeAndNameIgnoreCaseAndIdNot(category.getTicketType(), name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Category already exists for " + category.getTicketType());
        }
        category.setName(name);
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        TicketCategory saved = categoryRepository.save(category);
        auditRecorder.record("TICKET_CATEGORY_UPDATED",
                "Category updated: " + saved.getName() + " (" + saved.getTicketType()
                        + ", active=" + saved.isActive() + ")");
        return categoryMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TicketCategory category = findById(id);
        if (ticketRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Category is used by tickets. Deactivate it instead");
        }
        categoryRepository.delete(category);
        auditRecorder.record("TICKET_CATEGORY_DELETED",
                "Category deleted: " + category.getName() + " (" + category.getTicketType() + ")");
    }

        @Override
    @Transactional(readOnly = true)
    public List<TicketCategoryResponseDto> suggest(TicketType type, String text) {
        String q = text == null ? "" : text.trim();
        if (q.isEmpty()) {
            // nothing typed yet: show the first few so the box is not empty
            return categoryRepository.findByTicketTypeAndActiveTrueOrderByNameAsc(type).stream()
                    .limit(8)
                    .map(categoryMapper::toDto)
                    .toList();
        }
        // % _ and \ typed by the user must match literally
        String escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return categoryRepository.suggest(type, escaped, PageRequest.of(0, 8)).stream()
                .map(categoryMapper::toDto)
                .toList();
    }

    // own transaction: if two users create the same new name at the same moment,
    // the loser fails alone and the ticket flow can pick up the winner's row
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public TicketCategoryResponseDto findOrCreate(TicketType type, String rawName) {
        String name = rawName == null ? "" : rawName.trim().replaceAll("\\s+", " ");
        if (name.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be at least 2 characters");
        }
        if (name.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category cannot exceed 100 characters");
        }

              // 1) exact name ignoring case, 2) same name after plural/symbol/typo clean-up
        Optional<TicketCategory> existing = categoryRepository.findByTicketTypeAndNameIgnoreCase(type, name);
        if (existing.isEmpty()) {
            String typedKey = matchKey(name);
            existing = categoryRepository.findByTicketTypeOrderByNameAsc(type).stream()
                    .filter(c -> isSameCategory(typedKey, matchKey(c.getName())))
                    .findFirst();
        }
        if (existing.isPresent()) {
            TicketCategory found = existing.get();
            if (!found.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Category \"" + found.getName() + "\" is not available. Choose another");
            }
            return categoryMapper.toDto(found);
        }

        TicketCategory category = new TicketCategory();
        category.setTicketType(type);
        category.setName(name);
        category.setActive(true);
        TicketCategory saved = categoryRepository.saveAndFlush(category);
        auditRecorder.record("TICKET_CATEGORY_CREATED",
                "Category created while raising a ticket: " + saved.getName() + " (" + type + ")");
        return categoryMapper.toDto(saved);
    }

        // "Wi-Fi", "WiFi", "wi fi" -> "wifi". "Lights" -> "light". "Switches" -> "switch". "Supplies" -> "supply"
    private static String matchKey(String name) {
        String k = name.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
        if (k.length() > 4 && k.endsWith("ies")) {
            return k.substring(0, k.length() - 3) + "y";
        }
        if (k.length() > 4 && (k.endsWith("sses") || k.endsWith("xes") || k.endsWith("ches")
                || k.endsWith("shes") || k.endsWith("zes"))) {
            return k.substring(0, k.length() - 2);
        }
        if (k.length() > 3 && k.endsWith("s") && !k.endsWith("ss")) {
            return k.substring(0, k.length() - 1);
        }
        return k;
    }

    // same key, or one letter off for longer names without digits ("Electrcal" ~ "Electrical").
    // digits are skipped so "Floor1" and "Floor2" stay different
    private static boolean isSameCategory(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        if (a.equals(b)) {
            return true;
        }
        if (a.length() < 5 || b.length() < 5 || a.matches(".*\\d.*") || b.matches(".*\\d.*")) {
            return false;
        }
        return oneEditApart(a, b);
    }

    private static boolean oneEditApart(String a, String b) {
        int la = a.length();
        int lb = b.length();
        if (Math.abs(la - lb) > 1) {
            return false;
        }
        int i = 0;
        int j = 0;
        int edits = 0;
        while (i < la && j < lb) {
            if (a.charAt(i) == b.charAt(j)) {
                i++;
                j++;
                continue;
            }
            if (++edits > 1) {
                return false;
            }
            if (la > lb) {
                i++;
            } else if (lb > la) {
                j++;
            } else {
                i++;
                j++;
            }
        }
        return edits + (la - i) + (lb - j) <= 1;
    }

    private TicketCategory findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }
}