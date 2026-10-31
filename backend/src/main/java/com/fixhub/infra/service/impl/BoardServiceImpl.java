package com.fixhub.infra.service.impl;

import com.fixhub.infra.dto.BoardDto;
import com.fixhub.infra.dto.BoardSlotDto;
import com.fixhub.infra.dto.BoardUnitDto;
import com.fixhub.infra.entity.Booking;
import com.fixhub.infra.entity.InfraType;
import com.fixhub.infra.entity.Infrastructure;
import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.infra.repository.InfraTypeRepository;
import com.fixhub.infra.repository.InfrastructureRepository;
import com.fixhub.infra.service.BoardService;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.user.entity.Department;
import com.fixhub.user.repository.DepartmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BoardServiceImpl implements BoardService {

    private static final long MAX_DAYS = 8;

    private final InfraTypeRepository typeRepository;
    private final InfrastructureRepository unitRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final DepartmentRepository departmentRepository;

    public BoardServiceImpl(InfraTypeRepository typeRepository,
                            InfrastructureRepository unitRepository,
                            BookingRepository bookingRepository,
                            TicketRepository ticketRepository,
                            DepartmentRepository departmentRepository) {
        this.typeRepository = typeRepository;
        this.unitRepository = unitRepository;
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BoardDto board(Long infraTypeId, Instant from, Instant to, TicketActor actor) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End must be after start");
        }
        if (Duration.between(from, to).toDays() > MAX_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose at most " + MAX_DAYS + " days");
        }
        InfraType type = typeRepository.findById(infraTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kind not found"));

        List<Infrastructure> units = unitRepository.findByInfraTypeIdOrderByCapacityAscNameAsc(infraTypeId);
        List<Long> unitIds = units.stream().map(Infrastructure::getId).toList();
        List<Booking> bookings = unitIds.isEmpty()
                ? List.of()
                : bookingRepository.findInWindow(unitIds, AvailabilityServiceImpl.HOLDING, from, to);

        // author of each ticket (to mark "mine") and the team names
        Map<Long, Ticket> tickets = ticketRepository
                .findAllById(bookings.stream().map(Booking::getTicketId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Ticket::getId, Function.identity()));
        Map<Long, String> teams = departmentRepository
                .findAllById(bookings.stream().map(Booking::getDepartmentId).filter(Objects::nonNull)
                        .collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Department::getId, Department::getName));
        Map<Long, List<Booking>> byUnit = bookings.stream()
                .collect(Collectors.groupingBy(Booking::getInfrastructureId));

        List<BoardUnitDto> out = units.stream().map(u -> new BoardUnitDto(
                u.getId(), u.getName(), u.getCapacity(), u.getLocation(), u.getStatus(),
                byUnit.getOrDefault(u.getId(), List.of()).stream().map(b -> {
                    Ticket t = tickets.get(b.getTicketId());
                    boolean mine = t != null && actor.id().equals(t.getAuthorId());
                    return new BoardSlotDto(
                            b.getId(),
                            mine || actor.admin() ? b.getTicketId() : null,
                            b.getTitle(),
                            b.getDepartmentId() == null ? null : teams.get(b.getDepartmentId()),
                            b.getStartTime(), b.getEndTime(), b.isAllDay(), b.getStatus(), mine);
                }).toList())).toList();

        return new BoardDto(infraTypeId, type.getName(), from, to, out);
    }
}