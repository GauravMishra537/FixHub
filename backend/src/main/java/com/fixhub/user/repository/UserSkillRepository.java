package com.fixhub.user.repository;

import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findByUserId(Long userId);

    Optional<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);

    List<UserSkill> findBySkillId(Long skillId);

    List<UserSkill> findByStatusOrderByCreatedOnAsc(SkillStatus status);

    boolean existsBySkillIdAndStatus(Long skillId, SkillStatus status);
}