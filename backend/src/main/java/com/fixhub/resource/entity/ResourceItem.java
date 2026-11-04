package com.fixhub.resource.entity;

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

/** One requestable thing. totalStock is set for PHYSICAL and empty for DIGITAL. */
@Getter
@Setter
@Entity
@Table(name = "resource_item")
@SQLDelete(sql = "UPDATE resource_item SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class ResourceItem extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ItemKind kind;

    @Column(name = "total_stock")
    private Integer totalStock;

    @Column(name = "max_per_request", nullable = false)
    private int maxPerRequest = 1;

    @Column(nullable = false)
    private boolean active = true;
}