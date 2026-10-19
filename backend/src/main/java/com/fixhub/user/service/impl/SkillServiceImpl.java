package com.fixhub.user.service.impl;

import com.fixhub.common.audit.service.AuditRecorder;
import com.fixhub.user.dto.SkillRequestDto;
import com.fixhub.user.dto.SkillResponseDto;
import com.fixhub.user.dto.SkillReviewResponseDto;
import com.fixhub.user.dto.UserSkillRequestDto;
import com.fixhub.user.dto.UserSkillResponseDto;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.Skill;
import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.entity.User;
import com.fixhub.user.entity.UserSkill;
import com.fixhub.user.mapper.SkillMapper;
import com.fixhub.user.repository.SkillRepository;
import com.fixhub.user.repository.UserRepository;
import com.fixhub.user.repository.UserSkillRepository;
import com.fixhub.user.service.SkillService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SkillServiceImpl implements SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final SkillMapper skillMapper;
    private final AuditRecorder auditRecorder;

    public SkillServiceImpl(SkillRepository skillRepository,
                            UserSkillRepository userSkillRepository,
                            UserRepository userRepository,
                            SkillMapper skillMapper,
                            AuditRecorder auditRecorder) {
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
        this.userRepository = userRepository;
        this.skillMapper = skillMapper;
        this.auditRecorder = auditRecorder;
    }

    // ---------------- catalog ----------------

    @Override
    @Transactional(readOnly = true)
    public List<SkillResponseDto> getActiveSkills() {
        return skillRepository.findByActiveTrueOrderByNameAsc().stream().map(skillMapper::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SkillResponseDto> getAllSkills() {
        return skillRepository.findAllByOrderByNameAsc().stream().map(skillMapper::toDto).toList();
    }

    @Override
    @Transactional
    public SkillResponseDto createSkill(SkillRequestDto request) {
        String name = request.getName().trim();
        if (skillRepository.findByNameIgnoreCase(name).isPresent()) {
            throw conflict("Skill already exists");
        }
        Skill skill = new Skill();
        skill.setName(name);
        skill.setActive(request.getActive() == null || request.getActive());
        Skill saved = skillRepository.save(skill);
        auditRecorder.record("SKILL_CREATED", "Skill created: " + saved.getName());
        return skillMapper.toDto(saved);
    }

    @Override
    @Transactional
    public SkillResponseDto updateSkill(Long id, SkillRequestDto request) {
        Skill skill = findSkill(id);
        String name = request.getName().trim();
        if (skillRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw conflict("Skill name already used");
        }
        skill.setName(name);
        if (request.getActive() != null) {
            skill.setActive(request.getActive());
        }
        Skill saved = skillRepository.save(skill);
        auditRecorder.record("SKILL_UPDATED", "Skill updated: " + saved.getName() + " (active=" + saved.isActive() + ")");
        return skillMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteSkill(Long id) {
        Skill skill = findSkill(id);
        if (userSkillRepository.existsBySkillIdAndStatus(id, SkillStatus.APPROVED)) {
            throw conflict("Skill is used by users. Deactivate it instead");
        }
        userSkillRepository.deleteAll(userSkillRepository.findBySkillId(id));
        skillRepository.delete(skill);
        auditRecorder.record("SKILL_DELETED", "Skill deleted: " + skill.getName());
    }

    // ---------------- user side ----------------

    @Override
    @Transactional(readOnly = true)
    public List<UserSkillResponseDto> getUserSkills(Long userId) {
        List<UserSkill> links = userSkillRepository.findByUserId(userId);
        Map<Long, Skill> skills = skillMap(links.stream().map(UserSkill::getSkillId).toList());
        return links.stream()
                .map(l -> skillMapper.toUserSkillDto(l, skills.get(l.getSkillId())))
                .toList();
    }

    @Override
    @Transactional
    public UserSkillResponseDto requestSkill(Long userId, UserSkillRequestDto request) {
        User user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw bad("Admin cannot add skills");
        }
        Skill skill = resolveSkill(request, false);

        UserSkill link = userSkillRepository.findByUserIdAndSkillId(userId, skill.getId()).orElse(null);
        if (link != null) {
            if (link.getStatus() != SkillStatus.REJECTED) {
                throw conflict("Skill already added or waiting for review");
            }
            link.setStatus(SkillStatus.PENDING);
            link.setRejectReason(null);
            link.setReviewedBy(null);
            link.setReviewedOn(null);
        } else {
            link = new UserSkill(userId, skill.getId(), SkillStatus.PENDING);
        }
        UserSkill saved = userSkillRepository.save(link);
        auditRecorder.record("SKILL_REQUESTED", "Requested skill: " + skill.getName());
        return skillMapper.toUserSkillDto(saved, skill);
    }

    @Override
    @Transactional
    public void removeOwnSkill(Long userId, Long userSkillId) {
        UserSkill link = findLink(userSkillId);
        if (!link.getUserId().equals(userId)) {
            throw notFound("Skill link not found");
        }
        String name = skillName(link.getSkillId());
        userSkillRepository.delete(link);
        auditRecorder.record("SKILL_REMOVED", "Removed own skill: " + name);
    }

    // ---------------- admin review ----------------

    @Override
    @Transactional(readOnly = true)
    public List<SkillReviewResponseDto> getReviewList(SkillStatus status) {
        List<UserSkill> links = userSkillRepository.findByStatusOrderByCreatedOnAsc(status);
        Map<Long, Skill> skills = skillMap(links.stream().map(UserSkill::getSkillId).toList());
        Map<Long, User> users = userRepository.findAllById(links.stream().map(UserSkill::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return links.stream()
                .map(l -> skillMapper.toReviewDto(l, skills.get(l.getSkillId()), users.get(l.getUserId())))
                .toList();
    }

    @Override
    @Transactional
    public void approve(Long userSkillId, Long adminId) {
        UserSkill link = findLink(userSkillId);
        if (link.getStatus() != SkillStatus.PENDING) {
            throw conflict("Only pending requests can be approved");
        }
        Skill skill = findSkill(link.getSkillId());
        if (!skill.isActive()) {
            skill.setActive(true);
            skillRepository.save(skill);
        }
        link.setStatus(SkillStatus.APPROVED);
        link.setRejectReason(null);
        link.setReviewedBy(adminId);
        link.setReviewedOn(Instant.now());
        userSkillRepository.save(link);
        auditRecorder.record("SKILL_APPROVED",
                "Approved skill " + skill.getName() + " for " + userEmail(link.getUserId()));
    }

    @Override
    @Transactional
    public void reject(Long userSkillId, Long adminId, String reason) {
        UserSkill link = findLink(userSkillId);
        if (link.getStatus() != SkillStatus.PENDING) {
            throw conflict("Only pending requests can be rejected");
        }
        link.setStatus(SkillStatus.REJECTED);
        link.setRejectReason(reason.trim());
        link.setReviewedBy(adminId);
        link.setReviewedOn(Instant.now());
        userSkillRepository.save(link);
        auditRecorder.record("SKILL_REJECTED",
                "Rejected skill " + skillName(link.getSkillId()) + " for " + userEmail(link.getUserId())
                        + ": " + reason.trim());
    }

    // ---------------- admin manages user skills ----------------

    @Override
    @Transactional
    public UserSkillResponseDto adminAddSkill(Long userId, UserSkillRequestDto request, Long adminId) {
        User user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw bad("Admin cannot have skills");
        }
        Skill skill = resolveSkill(request, true);

        UserSkill link = userSkillRepository.findByUserIdAndSkillId(userId, skill.getId()).orElse(null);
        if (link != null) {
            if (link.getStatus() == SkillStatus.APPROVED) {
                throw conflict("User already has this skill");
            }
        } else {
            link = new UserSkill();
            link.setUserId(userId);
            link.setSkillId(skill.getId());
        }
        link.setStatus(SkillStatus.APPROVED);
        link.setRejectReason(null);
        link.setReviewedBy(adminId);
        link.setReviewedOn(Instant.now());
        UserSkill saved = userSkillRepository.save(link);
        auditRecorder.record("SKILL_ADDED_BY_ADMIN", "Added skill " + skill.getName() + " to " + user.getEmail());
        return skillMapper.toUserSkillDto(saved, skill);
    }

    @Override
    @Transactional
    public void adminRemoveSkill(Long userId, Long userSkillId) {
        UserSkill link = findLink(userSkillId);
        if (!link.getUserId().equals(userId)) {
            throw notFound("Skill link not found");
        }
        String name = skillName(link.getSkillId());
        userSkillRepository.delete(link);
        auditRecorder.record("SKILL_REMOVED_BY_ADMIN", "Removed skill " + name + " from " + userEmail(userId));
    }

    // ---------------- helpers ----------------

    /**
     * skillId: must be an active skill.
     * name: reuse existing skill, or create new one.
     * User-made new skill starts inactive. Admin-made starts active.
     */
    private Skill resolveSkill(UserSkillRequestDto request, boolean byAdmin) {
        if (request.getSkillId() != null) {
            Skill skill = findSkill(request.getSkillId());
            if (!skill.isActive()) {
                throw bad("Skill is not available");
            }
            return skill;
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw bad("skillId or name is required");
        }
        String name = request.getName().trim();
        Optional<Skill> existing = skillRepository.findByNameIgnoreCase(name);
        if (existing.isPresent()) {
            Skill skill = existing.get();
            if (!skill.isActive()) {
                if (byAdmin) {
                    skill.setActive(true);
                    skillRepository.save(skill);
                } else if (!userSkillRepository.existsBySkillIdAndStatus(skill.getId(), SkillStatus.PENDING)) {
                    throw conflict("Skill is not available. Ask admin");
                }
            }
            return skill;
        }
        Skill skill = new Skill();
        skill.setName(name);
        skill.setActive(byAdmin);
        return skillRepository.save(skill);
    }

    private Map<Long, Skill> skillMap(Collection<Long> ids) {
        return skillRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Skill::getId, Function.identity()));
    }

    private String skillName(Long skillId) {
        return skillRepository.findById(skillId).map(Skill::getName).orElse("unknown");
    }

    private String userEmail(Long userId) {
        return userRepository.findById(userId).map(User::getEmail).orElse("user " + userId);
    }

    private Skill findSkill(Long id) {
        return skillRepository.findById(id).orElseThrow(() -> notFound("Skill not found"));
    }

    private UserSkill findLink(Long id) {
        return userSkillRepository.findById(id).orElseThrow(() -> notFound("Skill link not found"));
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> notFound("User not found"));
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}