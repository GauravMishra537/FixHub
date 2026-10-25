package com.fixhub.ticket.service;

import com.fixhub.ticket.dto.RoutingRuleRequestDto;
import com.fixhub.ticket.dto.RoutingRuleResponseDto;

import java.util.List;

public interface RoutingRuleService {

    List<RoutingRuleResponseDto> list();

    RoutingRuleResponseDto create(RoutingRuleRequestDto request);

    RoutingRuleResponseDto update(Long id, RoutingRuleRequestDto request);

    void delete(Long id);
}