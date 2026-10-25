package com.fixhub.ticket.service.impl;

import com.fixhub.ticket.dto.CategoryConsoleDto;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.repository.TicketCategoryRepository;
import com.fixhub.ticket.service.CategoryConsoleService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CategoryConsoleServiceImpl implements CategoryConsoleService {

    private final TicketCategoryRepository categoryRepository;

    @PersistenceContext
    private EntityManager em;

    public CategoryConsoleServiceImpl(TicketCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryConsoleDto> list(TicketType type) {
        List<TicketCategory> categories = type == null
                ? categoryRepository.findAllByOrderByTicketTypeAscNameAsc()
                : categoryRepository.findByTicketTypeOrderByNameAsc(type);
        Map<Long, Long> counts = ticketCounts();
        return categories.stream().map(c -> toDto(c, counts.getOrDefault(c.getId(), 0L))).toList();
    }

    @Override
    @Transactional
    public CategoryConsoleDto rename(Long id, String name) {
        TicketCategory category = find(id);
        String clean = name == null ? "" : name.trim();
        if (clean.length() < 2 || clean.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be 2 to 100 characters");
        }
        if (categoryRepository.existsByTicketTypeAndNameIgnoreCaseAndIdNot(category.getTicketType(), clean, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another category already has this name");
        }
        category.setName(clean);
        categoryRepository.save(category);
        return toDto(category, ticketCounts().getOrDefault(id, 0L));
    }

    @Override
    @Transactional
    public CategoryConsoleDto setActive(Long id, boolean active) {
        TicketCategory category = find(id);
        category.setActive(active);
        categoryRepository.save(category);
        return toDto(category, ticketCounts().getOrDefault(id, 0L));
    }

    @Override
    @Transactional
    public CategoryConsoleDto merge(Long sourceId, Long targetId) {
        if (targetId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a category to merge into");
        }
        if (sourceId.equals(targetId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot merge a category into itself");
        }
        TicketCategory source = find(sourceId);
        TicketCategory target = find(targetId);
        if (source.getTicketType() != target.getTicketType()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both categories must be of the same type");
        }
        if (!target.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target category is disabled");
        }

        // tickets move to target. version bump makes anyone editing a stale copy get a 409
        em.createNativeQuery("""
                update ticket
                   set category_id = :target, version = version + 1, updated_on = now()
                 where category_id = :source
                """)
                .setParameter("target", targetId)
                .setParameter("source", sourceId)
                .executeUpdate();

        // routing: if target already has a rule for the same type, drop the source rule, else move it
        em.createNativeQuery("""
                delete from routing_rule r
                 where r.category_id = :source
                   and exists (select 1 from routing_rule t
                                where t.category_id = :target and t.ticket_type = r.ticket_type)
                """)
                .setParameter("source", sourceId)
                .setParameter("target", targetId)
                .executeUpdate();
        em.createNativeQuery("update routing_rule set category_id = :target where category_id = :source")
                .setParameter("target", targetId)
                .setParameter("source", sourceId)
                .executeUpdate();

        em.flush();
        em.clear();

        categoryRepository.delete(categoryRepository.findById(sourceId).orElseThrow());
        return toDto(find(targetId), ticketCounts().getOrDefault(targetId, 0L));
    }

    // ---------- helpers ----------

    private TicketCategory find(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    @SuppressWarnings("unchecked")
    private Map<Long, Long> ticketCounts() {
        List<Object[]> rows = em.createNativeQuery("""
                select category_id, count(*) from ticket
                 where category_id is not null and deleted_on is null
                 group by category_id
                """).getResultList();
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return map;
    }

    private CategoryConsoleDto toDto(TicketCategory c, long count) {
        return new CategoryConsoleDto(c.getId(), c.getTicketType(), c.getName(), c.isActive(), count);
    }
}