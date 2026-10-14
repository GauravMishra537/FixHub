package com.fixhub.user.repository;

import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);

    long countByRole(Role role);

    long countByRoleAndStatus(Role role, AccountStatus status);

    long countByStatus(AccountStatus status);

    List<User> findByStatus(AccountStatus status);

    List<User> findByRole(Role role);

}
