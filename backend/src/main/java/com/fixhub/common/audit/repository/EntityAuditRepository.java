package com.fixhub.common.audit.repository;

import com.fixhub.common.audit.entity.EntityAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EntityAuditRepository extends JpaRepository<EntityAudit, Long> {

    Optional<EntityAudit> findByEntityTypeAndEntityId(String entityType, Long entityId);
}
