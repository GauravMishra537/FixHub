package com.fixhub.infra.repository;

import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** Read only lookup so infra does not touch UserRepository. */
public interface InfraAdminRepository extends Repository<User, Long> {

    @Query("select u.id from User u where u.role = :role")
    List<Long> findIdsByRole(@Param("role") Role role);
}