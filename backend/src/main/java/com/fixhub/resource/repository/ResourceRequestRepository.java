package com.fixhub.resource.repository;

import com.fixhub.resource.entity.RequestStatus;
import com.fixhub.resource.entity.ResourceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResourceRequestRepository extends JpaRepository<ResourceRequest, Long> {

    Optional<ResourceRequest> findByTicketId(Long ticketId);

    // how many of one item are held right now
    @Query("""
            select coalesce(sum(r.quantity), 0L) from ResourceRequest r
            where r.itemId = :itemId and r.holding = true
            """)
    long heldQuantity(@Param("itemId") Long itemId);

    // the same for many items, for the catalog list
    @Query("""
            select r.itemId as itemId, sum(r.quantity) as held from ResourceRequest r
            where r.holding = true and r.itemId in :itemIds
            group by r.itemId
            """)
    List<HeldRow> heldQuantities(@Param("itemIds") Collection<Long> itemIds);

    // an item with a request in these statuses cannot be removed
    boolean existsByItemIdAndStatusIn(Long itemId, Collection<RequestStatus> statuses);

    // requests waiting for this department person, oldest first. feeds "My queue"
    List<ResourceRequest> findByDeptApproverIdAndStatusOrderByCreatedOnAsc(Long approverId, RequestStatus status);

    long countByDeptApproverIdAndStatus(Long approverId, RequestStatus status);
}