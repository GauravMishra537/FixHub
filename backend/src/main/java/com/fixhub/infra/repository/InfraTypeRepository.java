package com.fixhub.infra.repository;

import com.fixhub.infra.entity.InfraType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InfraTypeRepository extends JpaRepository<InfraType, Long> {

    // the cards on the booking page
    List<InfraType> findByActiveTrueOrderBySortOrderAscNameAsc();

    // the admin console sees switched-off kinds too
    List<InfraType> findAllByOrderBySortOrderAscNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}