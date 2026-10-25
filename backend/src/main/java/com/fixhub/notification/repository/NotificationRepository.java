package com.fixhub.notification.repository;

import com.fixhub.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // newest first
    Page<Notification> findByUserIdOrderByCreatedOnDescIdDesc(Long userId, Pageable pageable);

    long countByUserIdAndReadOnIsNull(Long userId);

    // a person can only touch their own rows
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.readOn = :now where n.userId = :userId and n.readOn is null")
    int markAllRead(@Param("userId") Long userId, @Param("now") Instant now);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.deletedOn = :now where n.userId = :userId")
    int clearAll(@Param("userId") Long userId, @Param("now") Instant now);
}