package com.fixhub.infra.service;

import com.fixhub.infra.dto.AvailabilityDto;

import java.time.Instant;

public interface AvailabilityService {

    /** Free units of one kind for one time window, fitted to the headcount. */
    AvailabilityDto search(Long infraTypeId, Instant start, Instant end, int headcount, boolean includeBigger);
}