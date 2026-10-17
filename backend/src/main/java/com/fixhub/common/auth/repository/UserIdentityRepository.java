package com.fixhub.common.auth.repository;

import com.fixhub.common.auth.entity.AuthProvider;
import com.fixhub.common.auth.entity.UserIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserIdentityRepository extends JpaRepository<UserIdentity, Long> {

    Optional<UserIdentity> findByProviderAndProviderSubject(AuthProvider provider, String providerSubject);

    List<UserIdentity> findByUserId(Long userId);
}