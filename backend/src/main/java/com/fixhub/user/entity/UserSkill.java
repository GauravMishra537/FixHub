package com.fixhub.user.entity;

import com.fixhub.common.audit.entity.AuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "user_skill")
@SQLDelete(sql = "UPDATE user_skill SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class UserSkill extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SkillStatus status = SkillStatus.PENDING;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_on")
    private Instant reviewedOn;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    public UserSkill() {
    }

    public UserSkill(Long userId, Long skillId, SkillStatus status) {
        this.userId = userId;
        this.skillId = skillId;
        this.status = status;
    }
}