package com.fixhub.topic.repository;

import com.fixhub.topic.entity.TopicDecline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TopicDeclineRepository extends JpaRepository<TopicDecline, Long> {

    // this person already gave this ticket back, so he cannot claim it again
    boolean existsByTicketIdAndUserId(Long ticketId, Long userId);

    // admin sees who was busy
    List<TopicDecline> findByTicketIdOrderByCreatedOnAsc(Long ticketId);
}