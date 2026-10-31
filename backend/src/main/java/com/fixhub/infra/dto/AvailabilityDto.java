package com.fixhub.infra.dto;

import java.util.List;

/**
 * Answer to: which units of this kind are free for this time and this many people?
 * units         = what the person may pick now.
 * fitCapacity   = the smallest size that holds the headcount (null when nothing holds it).
 * noneFree      = every unit of the fitting size is booked.
 * biggerAvailable = bigger units are free, ask again with includeBigger=true.
 * biggerShown   = units above are the bigger ones, the form must ask for a reason.
 */
public record AvailabilityDto(
        Long infraTypeId,
        int headcount,
        Integer fitCapacity,
        List<UnitAvailabilityDto> units,
        boolean noneFree,
        boolean biggerAvailable,
        boolean biggerShown,
        String message) {
}