package com.fixhub.user.service.impl;

import com.fixhub.common.audit.service.AuditService;
import com.fixhub.common.exception.BadRequestException;
import com.fixhub.common.exception.ResourceNotFoundException;
import com.fixhub.user.dto.UserResponseDto;
import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.mapper.UserMapper;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.service.AdminUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final AuditService auditService;

    public AdminUserServiceImpl(UserRepository userRepository,
                                UserMapper userMapper,
                                AuditService auditService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> listUsers(AccountStatus status) {
        List<User> users = (status == null) ? userRepository.findAll() : userRepository.findByStatus(status);
        return users.stream().map(userMapper::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getUser(Long id) {
        return userMapper.toDto(load(id));
    }

    @Override
    public UserResponseDto approve(Long id, String actorEmail) {
        User target = load(id);
        User actor = actor(actorEmail);

        if (target.getStatus() != AccountStatus.PENDING) {
            throw new BadRequestException("Only pending accounts can be approved");
        }
        if (!target.isEmailVerified()) {
            throw new BadRequestException("User has not verified their email yet");
        }

        target.setStatus(AccountStatus.ACTIVE);
        target.setRejectionReason(null);
        return finish(target, actor, "USER_APPROVED", "Approved by " + actor.getEmail());
    }

    @Override
    public UserResponseDto reject(Long id, String reason, String actorEmail) {
        User target = load(id);
        User actor = actor(actorEmail);

        if (target.getStatus() != AccountStatus.PENDING) {
            throw new BadRequestException("Only pending accounts can be rejected");
        }

        target.setStatus(AccountStatus.REJECTED);
        target.setRejectionReason(reason.trim());
        return finish(target, actor, "USER_REJECTED", "Rejected by " + actor.getEmail());
    }

    @Override
    public UserResponseDto suspend(Long id, String actorEmail) {
        User target = load(id);
        User actor = actor(actorEmail);

        if (target.getId().equals(actor.getId())) {
            throw new BadRequestException("You cannot suspend your own account");
        }
        if (target.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Only active accounts can be suspended");
        }
        if (target.getRole() == Role.ADMIN
                && userRepository.countByRoleAndStatus(Role.ADMIN, AccountStatus.ACTIVE) <= 1) {
            throw new BadRequestException("Cannot suspend the last active administrator");
        }

        target.setStatus(AccountStatus.SUSPENDED);
        return finish(target, actor, "USER_SUSPENDED", "Suspended by " + actor.getEmail());
    }

    @Override
    public UserResponseDto restore(Long id, String actorEmail) {
        User target = load(id);
        User actor = actor(actorEmail);

        if (target.getStatus() != AccountStatus.SUSPENDED) {
            throw new BadRequestException("Only suspended accounts can be restored");
        }

        target.setStatus(AccountStatus.ACTIVE);
        return finish(target, actor, "USER_RESTORED", "Restored by " + actor.getEmail());
    }

    private User load(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private User actor(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Acting administrator not found"));
    }

    private UserResponseDto finish(User target, User actor, String event, String description) {
        target.getAudit().setUpdatedBy(actor);
        User saved = userRepository.save(target);
        auditService.logEvent(event, saved.getId(), saved.getEmail(), description);
        return userMapper.toDto(saved);
    }
}