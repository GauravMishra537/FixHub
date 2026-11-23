package com.fixhub.topic.entity;

import com.fixhub.common.audit.entity.AuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/** One topic (skill) a topic ticket is about. People with that approved skill are asked to help. */
@Getter
@Setter
@Entity
@Table(name = "topic_request_skill")
@SQLDelete(sql = "UPDATE topic_request_skill SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class TopicRequestSkill extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    public TopicRequestSkill() {
    }

    public TopicRequestSkill(Long ticketId, Long skillId) {
        this.ticketId = ticketId;
        this.skillId = skillId;
    }
}