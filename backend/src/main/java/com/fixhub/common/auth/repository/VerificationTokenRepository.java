package com.fixhub.common.auth.repository;

import com.fixhub.common.auth.entity.VerificationToken;
import com.fixhub.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findByUserAndUsedFalse(User user);

    void deleteByUser(User user);
}
