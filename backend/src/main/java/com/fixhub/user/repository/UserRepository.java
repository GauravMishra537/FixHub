package com.fixhub.user.repository;

import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);

    long countByRole(Role role);

    List<User> findByRole(Role role);

    // Soft-deleted users are hidden from normal queries, so login uses this to
    // tell a removed person to register again (only after the password matches).
    @Query(value = "SELECT password_hash FROM users WHERE email = :email "
            + "AND deleted_on IS NOT NULL ORDER BY deleted_on DESC LIMIT 1", nativeQuery = true)
    Optional<String> findDeletedPasswordHash(@Param("email") String email);

    Optional<User> findByPasswordResetTokenHash(String passwordResetTokenHash);
}