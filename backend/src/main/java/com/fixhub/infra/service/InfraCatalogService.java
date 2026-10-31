package com.fixhub.infra.service;

import com.fixhub.infra.dto.InfraTypeDto;
import com.fixhub.infra.dto.InfraTypeRequestDto;
import com.fixhub.infra.dto.InfrastructureDto;
import com.fixhub.infra.dto.InfrastructureRequestDto;

import java.util.List;

public interface InfraCatalogService {

    /** includeInactive false = the cards on the booking page. true = the admin console. */
    List<InfraTypeDto> listTypes(boolean includeInactive);

    InfraTypeDto createType(InfraTypeRequestDto request);

    InfraTypeDto updateType(Long id, InfraTypeRequestDto request);

    /** Only when the kind has no units left. */
    void deleteType(Long id);

    /** Admin: every unit of a kind, smallest first, switched off ones too. */
    List<InfrastructureDto> listUnits(Long infraTypeId);

    InfrastructureDto createUnit(InfrastructureRequestDto request);

    InfrastructureDto updateUnit(Long id, InfrastructureRequestDto request);

    /** Only when no session holds the unit. */
    void deleteUnit(Long id);
}