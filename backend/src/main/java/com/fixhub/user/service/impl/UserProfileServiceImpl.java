package com.fixhub.user.service.impl;

import com.fixhub.common.audit.service.AuditRecorder;
import com.fixhub.user.dto.UserProfileRequestDto;
import com.fixhub.user.dto.UserProfileResponseDto;
import com.fixhub.user.dto.UserSkillRequestDto;
import com.fixhub.user.entity.Department;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.entity.User;
import com.fixhub.user.entity.UserSkill;
import com.fixhub.user.repository.DepartmentRepository;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.repository.UserSkillRepository;
import com.fixhub.user.service.SkillService;
import com.fixhub.user.service.UserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillService skillService;
    private final AuditRecorder auditRecorder;

    public UserProfileServiceImpl(UserRepository userRepository,
                                  DepartmentRepository departmentRepository,
                                  UserSkillRepository userSkillRepository,
                                  SkillService skillService,
                                  AuditRecorder auditRecorder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.userSkillRepository = userSkillRepository;
        this.skillService = skillService;
        this.auditRecorder = auditRecorder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDto getProfile(Long userId) {
        return toResponse(findUser(userId));
    }

    @Override
    @Transactional
    public UserProfileResponseDto updateProfile(Long userId, UserProfileRequestDto request, Long adminId) {
        User user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin profile cannot be changed here");
        }

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
            if (!department.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department is not active");
            }
            user.setDepartmentId(department.getId());
        }
        if (request.getDesignation() != null) {
            user.setDesignation(request.getDesignation().trim());
        }
        if (request.getWorkLocation() != null) {
            user.setWorkLocation(request.getWorkLocation().trim());
        }
        userRepository.save(user);

        if (request.getSkillIds() != null) {
            Set<Long> alreadyApproved = userSkillRepository.findByUserId(userId).stream()
                    .filter(l -> l.getStatus() == SkillStatus.APPROVED)
                    .map(UserSkill::getSkillId)
                    .collect(Collectors.toSet());
            for (Long skillId : new HashSet<>(request.getSkillIds())) {
                if (alreadyApproved.contains(skillId)) {
                    continue;
                }
                UserSkillRequestDto skillRequest = new UserSkillRequestDto();
                skillRequest.setSkillId(skillId);
                skillService.adminAddSkill(userId, skillRequest, adminId);
            }
        }

        auditRecorder.record("USER_PROFILE_UPDATED", "Profile set for " + user.getEmail());
        return toResponse(user);
    }

    private UserProfileResponseDto toResponse(User user) {
        UserProfileResponseDto dto = new UserProfileResponseDto();
        dto.setUserId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setDepartmentId(user.getDepartmentId());
        if (user.getDepartmentId() != null) {
            departmentRepository.findById(user.getDepartmentId())
                    .ifPresent(d -> dto.setDepartmentName(d.getName()));
        }
        dto.setDesignation(user.getDesignation());
        dto.setWorkLocation(user.getWorkLocation());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setSkills(skillService.getUserSkills(user.getId()));
        return dto;
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}