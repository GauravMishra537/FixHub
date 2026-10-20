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

import java.util.List;

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

    private TicketCategory findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }
}