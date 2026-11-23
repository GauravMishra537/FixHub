package com.fixhub.topic.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** "I'm busy": a helper gave the ticket back. Append only. He cannot claim that ticket again. */
@Getter
@Setter
@Entity
@Table(name = "topic_decline")
public class TopicDecline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 500)
    private String note;

    @Column(name = "created_on", nullable = false, updatable = false)
    private Instant createdOn = Instant.now();

    public TopicDecline() {
    }

    public TopicDecline(Long ticketId, Long userId, String note) {
        this.ticketId = ticketId;
        this.userId = userId;
        this.note = note;
    }
}