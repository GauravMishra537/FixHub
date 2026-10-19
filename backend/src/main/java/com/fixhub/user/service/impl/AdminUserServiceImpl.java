package com.fixhub.user.service.impl;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.auth.entity.AuthProvider;
import com.fixhub.common.auth.entity.RegistrationRequest;
import com.fixhub.common.auth.entity.RequestStatus;
import com.fixhub.common.auth.entity.UserIdentity;
import com.fixhub.common.auth.repository.RegistrationRequestRepository;
import com.fixhub.common.auth.repository.UserIdentityRepository;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.user.dto.RegistrationRequestDto;
import com.fixhub.user.dto.UserProfileRequestDto;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.repository.UserSkillRepository;
import com.fixhub.user.service.AdminUserService;
import com.fixhub.user.service.UserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final RegistrationRequestRepository requestRepository;
    private final UserIdentityRepository identityRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserProfileService userProfileService;
    private final UserMapper userMapper;
    private final AuditService auditService;

    public AdminUserServiceImpl(UserRepository userRepository,
                                RegistrationRequestRepository requestRepository,
                                UserIdentityRepository identityRepository,
                                UserSkillRepository userSkillRepository,
                                UserProfileService userProfileService,
                                UserMapper userMapper,
                                AuditService auditService) {
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.identityRepository = identityRepository;
        this.userSkillRepository = userSkillRepository;
        this.userProfileService = userProfileService;
        this.userMapper = userMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationRequestDto> listRequests(RequestStatus status) {
        List<RegistrationRequest> requests = (status == null)
                ? requestRepository.findAll()
                : requestRepository.findByRequestStatus(status);
        return requests.stream().map(userMapper::toRequestDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> listUsers() {
        return userRepository.findAll().stream().map(userMapper::toDto).toList();
    }

    @Override
    public UserResponseDto approve(Long requestId, UserProfileRequestDto details, Long actorId) {
        RegistrationRequest request = loadRequest(requestId);

        if (request.getRequestStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be approved");
        }
        if (!request.isEmailVerified()) {
            throw new BadRequestException("The applicant has not verified their email yet");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A user with this email already exists");
        }

        User user = new User(request.getEmail(), request.getPasswordHash(), request.getFullName(), Role.USER);
        User saved = userRepository.save(user);

        // Google signup: carry the Google id over to the new user
        if (request.getGoogleSubject() != null) {
            identityRepository.save(new UserIdentity(saved.getId(), AuthProvider.GOOGLE, request.getGoogleSubject()));
        }

        // Department, designation, skills chosen by admin in the approve dialog.
        // Same transaction: any error here rolls back the whole approval.
        if (details != null) {
            userProfileService.updateProfile(saved.getId(), details, actorId);
        }

        request.setRequestStatus(RequestStatus.APPROVED);
        request.setReviewedBy(actorId);
        request.setReviewedOn(Instant.now());
        request.setPasswordHash(null); // no second copy of the hash

        auditService.logEvent("USER_APPROVED", saved.getId(), saved.getEmail(),
                "Approved by " + actorEmail(actorId));
        return userMapper.toDto(saved);
    }

    @Override
    public RegistrationRequestDto reject(Long requestId, String reason, Long actorId) {
        RegistrationRequest request = loadRequest(requestId);

        if (request.getRequestStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be rejected");
        }

        request.setRequestStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason.trim());
        request.setReviewedBy(actorId);
        request.setReviewedOn(Instant.now());

        auditService.logEvent("USER_REJECTED", null, request.getEmail(),
                "Rejected by " + actorEmail(actorId));
        return userMapper.toRequestDto(request);
    }

    @Override
    public void deleteUser(Long userId, Long actorId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (target.getId().equals(actorId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        if (target.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrators cannot be deleted");
        }

        target.softDelete(actorId);
        userRepository.save(target);

        // Free the Google account so the same person can sign up again
        identityRepository.findByUserId(target.getId()).forEach(identity -> identity.softDelete(actorId));

        // Remove the user's skill links (pending, approved, rejected)
        userSkillRepository.findByUserId(target.getId()).forEach(link -> link.softDelete(actorId));

        auditService.logEvent("USER_DELETED", target.getId(), target.getEmail(),
                "Deleted by " + actorEmail(actorId));
    }

    private RegistrationRequest loadRequest(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration request not found with id: " + id));
    }

    private String actorEmail(Long actorId) {
        return userRepository.findById(actorId).map(User::getEmail).orElse("administrator");
    }
}