package com.fixhub.topic.repository;

import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.SkillStatus;
import com.fixhub.user.entity.UserSkill;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/** Read only. Who holds an approved skill. Never saves anything. */
public interface TopicHelperRepository extends Repository<UserSkill, Long> {

    // people who can help with any of these skills. not the author, and only normal users, not admins
    @Query("""
            select distinct us.userId from UserSkill us, User u
            where u.id = us.userId
              and u.role = :role
              and us.status = :status
              and us.skillId in :skillIds
              and us.userId <> :excludeUserId
            """)
    List<Long> findHelperIds(@Param("skillIds") Collection<Long> skillIds,
                             @Param("excludeUserId") Long excludeUserId,
                             @Param("status") SkillStatus status,
                             @Param("role") Role role);

    // the approved skills of one person. My queue and the claim rule use it
    @Query("select us.skillId from UserSkill us where us.userId = :userId and us.status = :status")
    List<Long> findSkillIdsOfUser(@Param("userId") Long userId, @Param("status") SkillStatus status);
}