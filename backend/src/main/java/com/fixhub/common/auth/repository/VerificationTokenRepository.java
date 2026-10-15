package com.fixhub.common.auth.repository;

import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.common.auth.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    List<VerificationToken> findAllByRegistrationRequestAndUsedFalse(RegistrationRequest registrationRequest);
}