package com.fixhub.infra.service.impl;

import com.fixhub.infra.dto.AvailabilityDto;
import com.fixhub.infra.dto.UnitAvailabilityDto;
import com.fixhub.infra.entity.BookingStatus;
import com.fixhub.infra.entity.InfraType;
import com.fixhub.infra.entity.Infrastructure;
import com.fixhub.infra.entity.InfrastructureStatus;
import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.infra.repository.InfraTypeRepository;
import com.fixhub.infra.repository.InfrastructureRepository;
import com.fixhub.infra.service.AvailabilityService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AvailabilityServiceImpl implements AvailabilityService {

    // a booking holds its slot while it waits for approval and after approval
    static final List<BookingStatus> HOLDING = List.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final InfraTypeRepository typeRepository;
    private final InfrastructureRepository unitRepository;
    private final BookingRepository bookingRepository;

    public AvailabilityServiceImpl(InfraTypeRepository typeRepository,
                                   InfrastructureRepository unitRepository,
                                   BookingRepository bookingRepository) {
        this.typeRepository = typeRepository;
        this.unitRepository = unitRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AvailabilityDto search(Long infraTypeId, Instant start, Instant end, int headcount, boolean includeBigger) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (headcount < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Headcount must be at least 1");
        }
        InfraType type = typeRepository.findById(infraTypeId)
                .filter(InfraType::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This kind is not available"));

        // units that are switched on and big enough, smallest first (the repository sorts by capacity)
        List<Infrastructure> fitting = unitRepository.findByInfraTypeIdOrderByCapacityAscNameAsc(infraTypeId).stream()
                .filter(u -> u.getStatus() == InfrastructureStatus.ACTIVE)
                .filter(u -> u.getCapacity() >= headcount)
                .toList();

        if (fitting.isEmpty()) {
            return new AvailabilityDto(infraTypeId, headcount, null, List.of(), false, false, false,
                    "No " + type.getName() + " holds " + headcount + " people");
        }

        // the tier = the smallest size that holds the headcount
        int tier = fitting.get(0).getCapacity();

        Set<Long> busy = new HashSet<>(bookingRepository.findBusyUnitIds(
                fitting.stream().map(Infrastructure::getId).toList(), HOLDING, start, end));

        List<UnitAvailabilityDto> tierFree = fitting.stream()
                .filter(u -> u.getCapacity() == tier && !busy.contains(u.getId()))
                .map(u -> toDto(u, false))
                .toList();
        if (!tierFree.isEmpty()) {
            return new AvailabilityDto(infraTypeId, headcount, tier, tierFree, false, false, false, null);
        }

        // every unit of the right size is taken. look at the bigger ones
        List<UnitAvailabilityDto> biggerFree = fitting.stream()
                .filter(u -> u.getCapacity() > tier && !busy.contains(u.getId()))
                .map(u -> toDto(u, true))
                .toList();

        if (biggerFree.isEmpty()) {
            return new AvailabilityDto(infraTypeId, headcount, tier, List.of(), true, false, false,
                    "Nothing is free for this time. Try another time");
        }
        if (!includeBigger) {
            return new AvailabilityDto(infraTypeId, headcount, tier, List.of(), true, true, false,
                    "All " + type.getName() + " that fit " + headcount + " people are booked for this time. "
                            + "Bigger ones are free");
        }
        return new AvailabilityDto(infraTypeId, headcount, tier, biggerFree, true, true, true,
                "These are bigger than needed. A reason is required");
    }

    private UnitAvailabilityDto toDto(Infrastructure u, boolean oversize) {
        return new UnitAvailabilityDto(u.getId(), u.getName(), u.getCapacity(), u.getLocation(), oversize);
    }
}