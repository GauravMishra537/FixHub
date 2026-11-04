package com.fixhub.resource.repository;

import com.fixhub.resource.entity.ResourceApprover;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResourceApproverRepository extends JpaRepository<ResourceApprover, Long> {

    Optional<ResourceApprover> findByDepartmentId(Long departmentId);
}