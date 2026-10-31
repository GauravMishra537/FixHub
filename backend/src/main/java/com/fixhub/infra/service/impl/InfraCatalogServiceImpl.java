package com.fixhub.infra.service.impl;

import com.fixhub.infra.dto.InfraTypeDto;
import com.fixhub.infra.dto.InfraTypeRequestDto;
import com.fixhub.infra.dto.InfrastructureDto;
import com.fixhub.infra.dto.InfrastructureRequestDto;
import com.fixhub.infra.entity.InfraType;
import com.fixhub.infra.entity.Infrastructure;
import com.fixhub.infra.entity.InfrastructureStatus;
import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.infra.repository.InfraTypeRepository;
import com.fixhub.infra.repository.InfrastructureRepository;
import com.fixhub.infra.service.InfraCatalogService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class InfraCatalogServiceImpl implements InfraCatalogService {

    private final InfraTypeRepository typeRepository;
    private final InfrastructureRepository unitRepository;
    private final BookingRepository bookingRepository;

    public InfraCatalogServiceImpl(InfraTypeRepository typeRepository,
                                   InfrastructureRepository unitRepository,
                                   BookingRepository bookingRepository) {
        this.typeRepository = typeRepository;
        this.unitRepository = unitRepository;
        this.bookingRepository = bookingRepository;
    }

    // ---------- kinds ----------

    @Override
    @Transactional(readOnly = true)
    public List<InfraTypeDto> listTypes(boolean includeInactive) {
        List<InfraType> types = includeInactive
                ? typeRepository.findAllByOrderBySortOrderAscNameAsc()
                : typeRepository.findByActiveTrueOrderBySortOrderAscNameAsc();
        Map<Long, List<Infrastructure>> unitsByType = unitRepository.findAll().stream()
                .collect(Collectors.groupingBy(Infrastructure::getInfraTypeId));
        return types.stream()
                .map(t -> toDto(t, unitsByType.getOrDefault(t.getId(), List.of())))
                .toList();
    }

    @Override
    @Transactional
    public InfraTypeDto createType(InfraTypeRequestDto request) {
        if (request == null) {
            throw bad("Details are required");
        }
        String name = cleanName(request.name(), "Name");
        if (typeRepository.existsByNameIgnoreCase(name)) {
            throw conflict("A kind named " + name + " already exists");
        }
        InfraType type = new InfraType();
        type.setName(name);
        fillType(type, request);
        try {
            typeRepository.saveAndFlush(type);
        } catch (DataIntegrityViolationException e) {
            throw conflict("A kind named " + name + " already exists");
        }
        return toDto(type, List.of());
    }

    @Override
    @Transactional
    public InfraTypeDto updateType(Long id, InfraTypeRequestDto request) {
        if (request == null) {
            throw bad("Details are required");
        }
        InfraType type = findType(id);
        String name = cleanName(request.name(), "Name");
        if (typeRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw conflict("A kind named " + name + " already exists");
        }
        type.setName(name);
        fillType(type, request);
        try {
            typeRepository.saveAndFlush(type);
        } catch (DataIntegrityViolationException e) {
            throw conflict("A kind named " + name + " already exists");
        }
        return toDto(type, unitRepository.findByInfraTypeIdOrderByCapacityAscNameAsc(id));
    }

    @Override
    @Transactional
    public void deleteType(Long id) {
        InfraType type = findType(id);
        if (!unitRepository.findByInfraTypeIdOrderByCapacityAscNameAsc(id).isEmpty()) {
            throw conflict("Remove the units of this kind first. To hide it, switch it off instead");
        }
        typeRepository.delete(type);
    }

    // description, icon, limit, order, switch. null keeps the old value
    private void fillType(InfraType type, InfraTypeRequestDto r) {
        String description = r.description() == null ? "" : r.description().trim();
        if (description.length() > 255) {
            throw bad("Description cannot exceed 255 characters");
        }
        type.setDescription(description.isEmpty() ? null : description);

        String icon = r.icon() == null ? "" : r.icon().trim();
        if (icon.length() > 40) {
            throw bad("Icon cannot exceed 40 characters");
        }
        type.setIcon(icon.isEmpty() ? null : icon);

        if (r.maxMinutes() != null) {
            if (r.maxMinutes() < 30 || r.maxMinutes() > 1440) {
                throw bad("Longest session must be between 30 and 1440 minutes");
            }
            type.setMaxMinutes(r.maxMinutes());
        }
        if (r.sortOrder() != null) {
            if (r.sortOrder() < 0 || r.sortOrder() > 1000) {
                throw bad("Order must be between 0 and 1000");
            }
            type.setSortOrder(r.sortOrder());
        }
        if (r.active() != null) {
            type.setActive(r.active());
        }
    }

    // ---------- units ----------

    @Override
    @Transactional(readOnly = true)
    public List<InfrastructureDto> listUnits(Long infraTypeId) {
        findType(infraTypeId);
        return unitRepository.findByInfraTypeIdOrderByCapacityAscNameAsc(infraTypeId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public InfrastructureDto createUnit(InfrastructureRequestDto request) {
        if (request == null || request.infraTypeId() == null) {
            throw bad("Choose the kind this unit belongs to");
        }
        findType(request.infraTypeId());
        String name = cleanName(request.name(), "Name");
        if (unitRepository.existsByInfraTypeIdAndNameIgnoreCase(request.infraTypeId(), name)) {
            throw conflict("A unit named " + name + " already exists in this kind");
        }
        Infrastructure unit = new Infrastructure();
        unit.setInfraTypeId(request.infraTypeId());
        unit.setName(name);
        fillUnit(unit, request);
        try {
            unitRepository.saveAndFlush(unit);
        } catch (DataIntegrityViolationException e) {
            throw conflict("A unit named " + name + " already exists in this kind");
        }
        return toDto(unit);
    }

    @Override
    @Transactional
    public InfrastructureDto updateUnit(Long id, InfrastructureRequestDto request) {
        if (request == null) {
            throw bad("Details are required");
        }
        Infrastructure unit = findUnit(id);
        String name = cleanName(request.name(), "Name");
        if (unitRepository.existsByInfraTypeIdAndNameIgnoreCaseAndIdNot(unit.getInfraTypeId(), name, id)) {
            throw conflict("A unit named " + name + " already exists in this kind");
        }
        // a different size would break the fit of sessions already booked
        if (request.capacity() != null && request.capacity() != unit.getCapacity()
                && upcoming(unit) > 0) {
            throw conflict("This unit has upcoming sessions. Change its size after they end or are cancelled");
        }
        unit.setName(name);
        fillUnit(unit, request);
        try {
            unitRepository.saveAndFlush(unit);
        } catch (DataIntegrityViolationException e) {
            throw conflict("A unit named " + name + " already exists in this kind");
        }
        return toDto(unit);
    }

    @Override
    @Transactional
    public void deleteUnit(Long id) {
        Infrastructure unit = findUnit(id);
        long held = upcoming(unit);
        if (held > 0) {
            throw conflict("This unit has " + held + " upcoming sessions. Cancel them first, "
                    + "or switch the unit off instead");
        }
        unitRepository.delete(unit);
    }

    // size, place, note, status. capacity is required on create, null on update keeps the old size
    private void fillUnit(Infrastructure unit, InfrastructureRequestDto r) {
        if (r.capacity() != null) {
            if (r.capacity() < 1 || r.capacity() > 1000) {
                throw bad("Capacity must be between 1 and 1000");
            }
            unit.setCapacity(r.capacity());
        } else if (unit.getId() == null) {
            throw bad("Capacity is required");
        }

        String location = r.location() == null ? "" : r.location().trim();
        if (location.length() > 100) {
            throw bad("Location cannot exceed 100 characters");
        }
        unit.setLocation(location.isEmpty() ? null : location);

        String note = r.note() == null ? "" : r.note().trim();
        if (note.length() > 255) {
            throw bad("Note cannot exceed 255 characters");
        }
        unit.setNote(note.isEmpty() ? null : note);

        if (r.status() != null) {
            unit.setStatus(r.status());
        }
    }

    // ---------- helpers ----------

    private InfraType findType(Long id) {
        return typeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kind not found"));
    }

    private Infrastructure findUnit(Long id) {
        return unitRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    private long upcoming(Infrastructure unit) {
        return bookingRepository.countByInfrastructureIdAndStatusInAndEndTimeAfter(
                unit.getId(), AvailabilityServiceImpl.HOLDING, Instant.now());
    }

    private InfraTypeDto toDto(InfraType t, List<Infrastructure> units) {
        List<Infrastructure> active = units.stream()
                .filter(u -> u.getStatus() == InfrastructureStatus.ACTIVE)
                .toList();
        int maxCapacity = active.stream().mapToInt(Infrastructure::getCapacity).max().orElse(0);
        return new InfraTypeDto(t.getId(), t.getName(), t.getDescription(), t.getIcon(),
                t.getMaxMinutes(), t.getSortOrder(), t.isActive(), units.size(), active.size(), maxCapacity);
    }

    private InfrastructureDto toDto(Infrastructure u) {
        return new InfrastructureDto(u.getId(), u.getInfraTypeId(), u.getName(), u.getCapacity(),
                u.getLocation(), u.getNote(), u.getStatus(), upcoming(u));
    }

    private static String cleanName(String value, String label) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty()) {
            throw bad(label + " is required");
        }
        if (name.length() > 100) {
            throw bad(label + " cannot exceed 100 characters");
        }
        return name;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}