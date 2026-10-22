package com.fixhub.ticket.repository;

import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Long> {

    // admin list, all types
    List<TicketCategory> findAllByOrderByTicketTypeAscNameAsc();

    // admin list, one type
    List<TicketCategory> findByTicketTypeOrderByNameAsc(TicketType ticketType);

    // user dropdown: active only
    List<TicketCategory> findByTicketTypeAndActiveTrueOrderByNameAsc(TicketType ticketType);

    // find by exact name (case ignored). used when a ticket is created
    Optional<TicketCategory> findByTicketTypeAndNameIgnoreCase(TicketType ticketType, String name);

    // name must be unique per type (case ignored)
    boolean existsByTicketTypeAndNameIgnoreCase(TicketType ticketType, String name);

    // same check while editing, skip the row itself
    boolean existsByTicketTypeAndNameIgnoreCaseAndIdNot(TicketType ticketType, String name, Long id);

    // suggestions while typing: active, name contains the text, names that START with it come first.
    // the caller escapes % _ and \ in the text, and passes a page size of 8
    @Query("""
            select c from TicketCategory c
            where c.ticketType = :type
              and c.active = true
              and lower(c.name) like lower(concat('%', :q, '%')) escape '\\'
            order by case when lower(c.name) like lower(concat(:q, '%')) escape '\\' then 0 else 1 end,
                     c.name
            """)
    List<TicketCategory> suggest(@Param("type") TicketType type,
                                 @Param("q") String q,
                                 Pageable pageable);
}