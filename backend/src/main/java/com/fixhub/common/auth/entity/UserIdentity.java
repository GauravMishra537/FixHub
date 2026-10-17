package com.fixhub.common.auth.entity;

import com.fixhub.common.audit.entity.AuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "user_identities")
@SQLDelete(sql = "UPDATE user_identities SET deleted_on = now(), updated_on = now() WHERE id = ?")
@SQLRestriction("deleted_on IS NULL")
public class UserIdentity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @Column(name = "provider_subject", nullable = false)
    private String providerSubject;

    public UserIdentity() {
    }

    public UserIdentity(Long userId, AuthProvider provider, String providerSubject) {
        this.userId = userId;
        this.provider = provider;
        this.providerSubject = providerSubject;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public AuthProvider getProvider() { return provider; }
    public String getProviderSubject() { return providerSubject; }
}