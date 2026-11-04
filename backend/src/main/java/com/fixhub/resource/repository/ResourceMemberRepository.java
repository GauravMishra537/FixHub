package com.fixhub.resource.repository;

import com.fixhub.user.entity.User;
import org.springframework.data.repository.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Read only look at users, for approvers. Soft deleted users are hidden by the entity itself. */
public interface ResourceMemberRepository extends Repository<User, Long> {

    Optional<User> findById(Long id);

    List<User> findByIdIn(Collection<Long> ids);

    List<User> findByDepartmentIdOrderByFullNameAsc(Long departmentId);
}