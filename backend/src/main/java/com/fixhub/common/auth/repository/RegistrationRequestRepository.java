package com.fixhub.common.auth.repository;

import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.common.auth.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {

    Optional<RegistrationRequest> findByEmailAndRequestStatus(String email, RequestStatus status);

    boolean existsByEmailAndRequestStatus(String email, RequestStatus status);

    Optional<RegistrationRequest> findFirstByEmailOrderByCreatedOnDesc(String email);

    List<RegistrationRequest> findByRequestStatus(RequestStatus status);

    long countByRequestStatus(RequestStatus status);

}