package com.fixhub.resource.repository;

import com.fixhub.resource.entity.ResourceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceCategoryRepository extends JpaRepository<ResourceCategory, Long> {

    // the groups, in page order
    List<ResourceCategory> findByParentIdIsNullOrderBySortOrderAscNameAsc();

    // the sub-categories of one group
    List<ResourceCategory> findByParentIdOrderBySortOrderAscNameAsc(Long parentId);

    // every sub-category, to build the tree in one query
    List<ResourceCategory> findByParentIdIsNotNullOrderBySortOrderAscNameAsc();

    // a group with sub-categories cannot be removed
    boolean existsByParentId(Long parentId);

    // same name among siblings: the database refuses it too, this gives a clear message first
    boolean existsByParentIdAndNameIgnoreCase(Long parentId, String name);

    boolean existsByParentIdIsNullAndNameIgnoreCase(String name);
}