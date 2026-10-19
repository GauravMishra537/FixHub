package com.fixhub.common.audit.repository;

import com.fixhub.common.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findByEventTypeOrderByCreatedAtDesc(String eventType);

    @Query("select a from AuditLog a "
            + "where (:eventType is null or a.eventType = :eventType) "
            + "and (:userId is null or a.userId = :userId)")
    Page<AuditLog> search(@Param("eventType") String eventType,
                          @Param("userId") Long userId,
                          Pageable pageable);
}