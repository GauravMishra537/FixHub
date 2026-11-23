package com.fixhub.topic.repository;

import com.fixhub.user.entity.Skill;
import org.springframework.data.repository.Repository;

import java.util.Collection;
import java.util.List;

/** Read only. The skills a person can pick as topics. A skill with active = false is not accepted yet. */
public interface TopicSkillRepository extends Repository<Skill, Long> {

    List<Skill> findByActiveTrueOrderByNameAsc();

    List<Skill> findByIdIn(Collection<Long> ids);
}