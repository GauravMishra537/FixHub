package com.fixhub.ticket.service.impl;

import com.fixhub.ticket.entity.RoutingRule;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.ticket.repository.RoutingRuleRepository;
import com.fixhub.ticket.service.RoutingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RoutingServiceImpl implements RoutingService {

    private final RoutingRuleRepository ruleRepository;

    public RoutingServiceImpl(RoutingRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> resolveDepartmentId(TicketType type, Long categoryId) {
        if (type == null) {
            return Optional.empty();
        }

        // 1. the most exact rule: this type and this category
        if (categoryId != null) {
            Optional<RoutingRule> exact =
                    ruleRepository.findByTicketTypeAndCategoryIdAndActiveTrue(type, categoryId);
            if (exact.isPresent()) {
                return exact.map(RoutingRule::getDepartmentId);
            }
        }

        // 2. a rule for the whole type
        return ruleRepository.findByTicketTypeAndCategoryIdIsNullAndActiveTrue(type)
                .map(RoutingRule::getDepartmentId);
    }
}