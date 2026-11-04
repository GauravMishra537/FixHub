package com.fixhub.resource.repository;

import com.fixhub.resource.entity.ResourceItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResourceItemRepository extends JpaRepository<ResourceItem, Long> {

    List<ResourceItem> findByCategoryIdOrderByNameAsc(Long categoryId);

    List<ResourceItem> findByCategoryIdInOrderByNameAsc(Collection<Long> categoryIds);

    // a category with items cannot be removed
    boolean existsByCategoryId(Long categoryId);

    boolean existsByCategoryIdAndNameIgnoreCase(Long categoryId, String name);

    /**
     * The item row, locked until the transaction ends. A request takes this lock before it counts the stock,
     * so two people asking for the last item at the same time are served one after the other.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from ResourceItem i where i.id = :id")
    Optional<ResourceItem> findByIdForUpdate(@Param("id") Long id);
}