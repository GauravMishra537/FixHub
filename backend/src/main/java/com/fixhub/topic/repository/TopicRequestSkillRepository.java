package com.fixhub.topic.repository;

import com.fixhub.topic.entity.TopicRequestSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TopicRequestSkillRepository extends JpaRepository<TopicRequestSkill, Long> {

    // the topics of one ticket
    List<TopicRequestSkill> findByTicketIdOrderByIdAsc(Long ticketId);

    // the topics of many tickets, for a list
    List<TopicRequestSkill> findByTicketIdIn(Collection<Long> ticketIds);

    // tickets about any of these skills. My queue uses it with my own approved skills
    @Query("select distinct t.ticketId from TopicRequestSkill t where t.skillId in :skillIds")
    List<Long> findTicketIdsBySkillIds(@Param("skillIds") Collection<Long> skillIds);
}