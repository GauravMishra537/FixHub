package com.fixhub.topic.repository;

import com.fixhub.topic.entity.TopicLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicLinkRepository extends JpaRepository<TopicLink, Long> {

    List<TopicLink> findByTicketIdOrderByIdAsc(Long ticketId);

    long countByTicketId(Long ticketId);

    Optional<TopicLink> findByIdAndTicketId(Long id, Long ticketId);
}