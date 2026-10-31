package com.fixhub.infra.repository;

import com.fixhub.infra.entity.Infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InfrastructureRepository extends JpaRepository<Infrastructure, Long> {

    // smallest first, the order the fit search uses
    List<Infrastructure> findByInfraTypeIdOrderByCapacityAscNameAsc(Long infraTypeId);

    boolean existsByInfraTypeIdAndNameIgnoreCase(Long infraTypeId, String name);

    boolean existsByInfraTypeIdAndNameIgnoreCaseAndIdNot(Long infraTypeId, String name, Long id);
}