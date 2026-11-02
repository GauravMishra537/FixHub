package com.fixhub.infra.service.impl;

import com.fixhub.infra.dto.AvailabilityDto;
import com.fixhub.infra.dto.BookingGroupDto;
import com.fixhub.infra.dto.BookingRequestDto;
import com.fixhub.infra.dto.BookingResponseDto;
import com.fixhub.infra.dto.SessionRequestDto;
import com.fixhub.infra.dto.UnitAvailabilityDto;
import com.fixhub.infra.entity.Booking;
import com.fixhub.infra.entity.BookingStatus;
import com.fixhub.infra.entity.InfraType;
import com.fixhub.infra.entity.Infrastructure;
import com.fixhub.infra.repository.BookingRepository;
import com.fixhub.infra.repository.InfraAdminRepository;
import com.fixhub.infra.repository.InfraCategoryRepository;
import com.fixhub.infra.repository.InfraTypeRepository;
import com.fixhub.infra.repository.InfrastructureRepository;
import com.fixhub.infra.service.AvailabilityService;
import com.fixhub.infra.service.BookingService;
import com.fixhub.notification.entity.NotificationType;
import com.fixhub.notification.service.NotificationService;
import com.fixhub.ticket.entity.HistoryAction;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketCategory;
import com.fixhub.ticket.entity.TicketHistory;
import com.fixhub.ticket.entity.TicketStatus;
import com.fixhub.ticket.entity.TicketType;
import com.fixhub.infra.dto.InfraSettingsDto;
import com.fixhub.infra.dto.InfraSettingsRequestDto;
import com.fixhub.ticket.entity.TicketPriority;
import com.fixhub.ticket.entity.TicketVisibility;
import com.fixhub.ticket.repository.TicketHistoryRepository;
import com.fixhub.ticket.repository.TicketRepository;
import com.fixhub.ticket.service.TicketActor;
import com.fixhub.ticket.service.TicketCategoryService;
import com.fixhub.ticket.service.TicketNumberService;
import com.fixhub.ticket.service.TicketRules;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import com.fixhub.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    private static final int MAX_UPCOMING = 10;
    private static final int MAX_DAYS_AHEAD = 30;
    // times sit on the hour or the half hour
    private static final long STEP_SECONDS = 30 * 60;
    private static final int MAX_TITLE = 200;
    private static final int MAX_REASON = 500;
    private static final int MAX_NOTE = 1000;
    private static final int MAX_MESSAGE = 255;

    private final AvailabilityService availabilityService;
    private final BookingRepository bookingRepository;
    private final InfraTypeRepository typeRepository;
    private final InfrastructureRepository unitRepository;
    private final InfraCategoryRepository categoryRepository;
    private final InfraAdminRepository adminRepository;
    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketNumberService ticketNumberService;
    private final TicketCategoryService categoryService;
    private final TicketRules rules;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingServiceImpl(AvailabilityService availabilityService,
                              BookingRepository bookingRepository,
                              InfraTypeRepository typeRepository,
                              InfrastructureRepository unitRepository,
                              InfraCategoryRepository categoryRepository,
                              InfraAdminRepository adminRepository,
                              TicketRepository ticketRepository,
                              TicketHistoryRepository historyRepository,
                              TicketNumberService ticketNumberService,
                              TicketCategoryService categoryService,
                              TicketRules rules,
                              UserRepository userRepository,
                              NotificationService notificationService) {
        this.availabilityService = availabilityService;
        this.bookingRepository = bookingRepository;
        this.typeRepository = typeRepository;
        this.unitRepository = unitRepository;
        this.categoryRepository = categoryRepository;
        this.adminRepository = adminRepository;
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.ticketNumberService = ticketNumberService;
        this.categoryService = categoryService;
        this.rules = rules;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ---------- create ----------

    @Override
    @Transactional
    public BookingGroupDto create(BookingRequestDto request, TicketActor actor) {
        if (request == null) {
            throw bad("Booking details are required");
        }
        String title = clean(request.title());
        if (title.isEmpty()) {
            throw bad("Title is required");
        }
        if (title.length() > MAX_TITLE) {
            throw bad("Title cannot exceed " + MAX_TITLE + " characters");
        }
        String note = clean(request.note());
        if (note.length() > MAX_NOTE) {
            throw bad("Note cannot exceed " + MAX_NOTE + " characters");
        }
        int headcount = request.headcount() == null ? 0 : request.headcount();
        if (headcount < 1 || headcount > 1000) {
            throw bad("Headcount must be between 1 and 1000");
        }
        List<SessionRequestDto> sessions = request.sessions();
        if (sessions == null || sessions.isEmpty()) {
            throw bad("Add at least one session");
        }
        if (sessions.size() > MAX_UPCOMING) {
            throw bad("You can add at most " + MAX_UPCOMING + " sessions in one request");
        }
        if (request.infraTypeId() == null) {
            throw bad("Choose what you want to book");
        }
        InfraType type = typeRepository.findById(request.infraTypeId())
                .filter(InfraType::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This kind is not available"));

        Instant now = Instant.now();
        long upcoming = bookingRepository.countUpcomingByAuthor(actor.id(), AvailabilityServiceImpl.HOLDING, now);
        if (upcoming + sessions.size() > MAX_UPCOMING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You can hold at most " + MAX_UPCOMING + " upcoming sessions. You hold " + upcoming + " now");
        }

        // check every session before anything is written
        List<Booking> rows = new ArrayList<>();
        for (int i = 0; i < sessions.size(); i++) {
            rows.add(checkSession(type, headcount, sessions.get(i), now, i + 1));
        }
        checkSameUnitOverlap(rows);

        // the ticket
        Ticket ticket = new Ticket();
        ticket.setType(TicketType.INFRA_BOOKING);
        ticket.setTicketNo(ticketNumberService.nextTicketNo());
        ticket.setTitle(title);
        ticket.setDescription(note.isEmpty() ? null : note);
        ticket.setStatus(TicketStatus.PENDING_APPROVAL);
        ticket.setAuthorId(actor.id());
                if (request.priority() != null) {
            ticket.setPriority(request.priority());
        }
        if (request.visibility() != null) {
            ticket.setVisibility(request.visibility());
        }

        ticket.setCategoryId(categoryIdFor(type.getName()));
        ticket = ticketRepository.saveAndFlush(ticket);

        // the sessions. the database refuses a double booking even when two people click together
        Long departmentId = userRepository.findById(actor.id()).map(User::getDepartmentId).orElse(null);
        for (Booking row : rows) {
            row.setTicketId(ticket.getId());
            row.setDepartmentId(departmentId);
            row.setTitle(title);
            row.setHeadcount(headcount);
            row.setStatus(BookingStatus.PENDING);
            try {
                bookingRepository.saveAndFlush(row);
            } catch (DataIntegrityViolationException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Someone just booked one of these units. Search again and pick another");
            }
        }

        TicketHistory created = new TicketHistory();
        created.setTicketId(ticket.getId());
        created.setActorId(actor.id());
        created.setAction(HistoryAction.CREATED);
        created.setNote(rows.size() + (rows.size() == 1 ? " session" : " sessions") + " requested");
        historyRepository.save(created);

        // every admin must decide, so every admin hears
        String who = userName(actor.id());
        tellAdmins(actor.id(), NotificationType.BOOKING_REQUESTED, ticket.getId(),
                who + " requested " + type.getName() + " " + ticket.getTicketNo() + " (" + title + "), "
                        + rows.size() + (rows.size() == 1 ? " session" : " sessions"));

        return new BookingGroupDto(ticket.getId(), ticket.getTicketNo(), ticket.getTitle(), toDtos(rows));
    }

    // one session: rules first, then the real free check through the same search the form used
    private Booking checkSession(InfraType type, int headcount, SessionRequestDto s, Instant now, int number) {
        String at = "Session " + number + ": ";
        if (s == null || s.infrastructureId() == null || s.startTime() == null || s.endTime() == null) {
            throw bad(at + "unit, start and end are required");
        }
        Instant start = s.startTime();
        Instant end = s.endTime();
        if (!end.isAfter(start)) {
            throw bad(at + "end time must be after start time");
        }
        if (start.isBefore(now)) {
            throw bad(at + "start time is in the past");
        }
        if (start.isAfter(now.plus(MAX_DAYS_AHEAD, ChronoUnit.DAYS))) {
            throw bad(at + "you can book up to " + MAX_DAYS_AHEAD + " days ahead");
        }
        if (!s.allDay() && (start.getNano() != 0 || end.getNano() != 0
                || start.getEpochSecond() % STEP_SECONDS != 0 || end.getEpochSecond() % STEP_SECONDS != 0)) {
            throw bad(at + "times must be on the hour or the half hour");
        }
        String reason = clean(s.reason());
        if (reason.length() > MAX_REASON) {
            throw bad(at + "reason cannot exceed " + MAX_REASON + " characters");
        }
        long minutes = Duration.between(start, end).toMinutes();
        if (s.allDay() && reason.isEmpty()) {
            throw bad(at + "an all day booking needs a reason");
        }
        if (!s.allDay() && minutes > type.getMaxMinutes() && reason.isEmpty()) {
            throw bad(at + "longer than " + type.getMaxMinutes() + " minutes needs a reason");
        }

        AvailabilityDto found = availabilityService.search(type.getId(), start, end, headcount, true);
        UnitAvailabilityDto unit = found.units().stream()
                .filter(u -> u.id().equals(s.infrastructureId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        at + "this unit is not free for this time or does not fit " + headcount + " people"));
        if (unit.oversize() && reason.isEmpty()) {
            throw bad(at + "a bigger unit than needed requires a reason");
        }

        Booking b = new Booking();
        b.setInfrastructureId(unit.id());
        b.setStartTime(start);
        b.setEndTime(end);
        b.setAllDay(s.allDay());
        b.setReason(reason.isEmpty() ? null : reason);
        b.setOversize(unit.oversize());
        return b;
    }

    // two sessions of the same request on the same unit at the same time
    private void checkSameUnitOverlap(List<Booking> rows) {
        for (int i = 0; i < rows.size(); i++) {
            for (int j = i + 1; j < rows.size(); j++) {
                Booking a = rows.get(i);
                Booking b = rows.get(j);
                if (a.getInfrastructureId().equals(b.getInfrastructureId())
                        && a.getStartTime().isBefore(b.getEndTime())
                        && a.getEndTime().isAfter(b.getStartTime())) {
                    throw bad("Sessions " + (i + 1) + " and " + (j + 1) + " use the same unit at overlapping times");
                }
            }
        }
    }

    // the card chip shows the kind. find the category, or let the category service make it
    private Long categoryIdFor(String kindName) {
        return categoryRepository.findFirstByTicketTypeAndNameIgnoreCase(TicketType.INFRA_BOOKING, kindName)
                .map(TicketCategory::getId)
                .orElseGet(() -> {
                    categoryService.findOrCreate(TicketType.INFRA_BOOKING, kindName);
                    return categoryRepository.findFirstByTicketTypeAndNameIgnoreCase(TicketType.INFRA_BOOKING, kindName)
                            .map(TicketCategory::getId)
                            .orElse(null);
                });
    }

    // ---------- read ----------

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> getSessions(Long ticketId, TicketActor actor) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (!rules.canView(ticket, actor.id(), actor.admin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this ticket");
        }
        if (ticket.getType() != TicketType.INFRA_BOOKING) {
            return List.of();
        }
        return toDtos(bookingRepository.findByTicketIdOrderByStartTimeAsc(ticketId));
    }

        // ---------- priority and visibility ----------

    @Override
    @Transactional
    public InfraSettingsDto updateSettings(Long ticketId, InfraSettingsRequestDto request, TicketActor actor) {
        if (request == null || (request.priority() == null && request.visibility() == null)) {
            throw bad("Choose a priority or a visibility");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        if (ticket.getType() != TicketType.INFRA_BOOKING) {
            throw bad("This is not an infra booking");
        }
        if (!actor.admin() && !ticket.getAuthorId().equals(actor.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author or an admin can change this");
        }
        TicketStatus s = ticket.getStatus();
        if (s != TicketStatus.PENDING_APPROVAL && s != TicketStatus.APPROVED
                && s != TicketStatus.PARTIALLY_APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is finished and cannot be changed");
        }
        if (request.version() != null && !request.version().equals(ticket.getVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This ticket changed while you were looking. Reload and try again");
        }

        TicketPriority oldPriority = ticket.getPriority();
        TicketVisibility oldVisibility = ticket.getVisibility();
        boolean priorityChanged = request.priority() != null && request.priority() != oldPriority;
        boolean visibilityChanged = request.visibility() != null && request.visibility() != oldVisibility;
        if (!priorityChanged && !visibilityChanged) {
            return new InfraSettingsDto(oldPriority, oldVisibility, ticket.getVersion());
        }
        if (priorityChanged) {
            ticket.setPriority(request.priority());
        }
        if (visibilityChanged) {
            ticket.setVisibility(request.visibility());
        }
        ticket = ticketRepository.saveAndFlush(ticket);

        if (priorityChanged) {
            logSetting(ticketId, actor.id(), "priority", oldPriority.name(), request.priority().name());
        }
        if (visibilityChanged) {
            logSetting(ticketId, actor.id(), "visibility", oldVisibility.name(), request.visibility().name());
        }
        return new InfraSettingsDto(ticket.getPriority(), ticket.getVisibility(), ticket.getVersion());
    }

    private void logSetting(Long ticketId, Long actorId, String field, String from, String to) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actorId);
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName(field);
        row.setFromValue(from);
        row.setToValue(to);
        historyRepository.save(row);
    }

    // ---------- admin cancels one session ----------

    // ---------- admin decides one session ----------

    @Override
    @Transactional
    public BookingResponseDto approveSession(Long bookingId, TicketActor actor) {
        requireAdmin(actor);
        Booking b = findBooking(bookingId);
        Ticket ticket = findOpenTicket(b);
        if (b.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This session is already " + b.getStatus());
        }
        if (!b.getEndTime().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This session already ended");
        }
        BookingStatus before = b.getStatus();
        mark(b, BookingStatus.APPROVED, null, actor);
        String unitName = unitName(b);
        logSession(ticket.getId(), actor.id(), before, BookingStatus.APPROVED, unitName + " approved");
        finishDecision(ticket, actor);
        return toDtos(List.of(b)).get(0);
    }

    @Override
    @Transactional
    public BookingResponseDto rejectSession(Long bookingId, String note, TicketActor actor) {
        requireAdmin(actor);
        String reason = clean(note);
        if (reason.isEmpty()) {
            throw bad("A reason is required");
        }
        if (reason.length() > MAX_REASON) {
            throw bad("Reason cannot exceed " + MAX_REASON + " characters");
        }
        Booking b = findBooking(bookingId);
        Ticket ticket = findOpenTicket(b);
        boolean pending = b.getStatus() == BookingStatus.PENDING;
        boolean approvedNotStarted = b.getStatus() == BookingStatus.APPROVED
                && b.getStartTime().isAfter(Instant.now());
        if (!pending && !approvedNotStarted) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This session is " + b.getStatus() + " and cannot be rejected now");
        }
        BookingStatus before = b.getStatus();
        mark(b, BookingStatus.REJECTED, reason, actor);
        String unitName = unitName(b);
        logSession(ticket.getId(), actor.id(), before, BookingStatus.REJECTED,
                cut(unitName + ": " + reason, MAX_REASON));

        // the author hears about every rejection, with the reason
        tell(ticket.getAuthorId(), actor.id(), NotificationType.BOOKING_REJECTED, ticket.getId(),
                ticket.getTicketNo() + ": session on " + unitName + " was rejected. " + reason);
        finishDecision(ticket, actor);
        return toDtos(List.of(b)).get(0);
    }

    private void requireAdmin(TicketActor actor) {
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an admin can decide a session");
        }
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    // the ticket must still be in play: pending, approved or partly approved
    private Ticket findOpenTicket(Booking b) {
        Ticket ticket = ticketRepository.findById(b.getTicketId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        TicketStatus s = ticket.getStatus();
        if (s != TicketStatus.PENDING_APPROVAL && s != TicketStatus.APPROVED
                && s != TicketStatus.PARTIALLY_APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ticket is already " + s);
        }
        return ticket;
    }

    private void mark(Booking b, BookingStatus status, String note, TicketActor actor) {
        b.setStatus(status);
        b.setDecidedBy(actor.id());
        b.setDecidedOn(Instant.now());
        b.setDecisionNote(note);
        bookingRepository.saveAndFlush(b);
    }

    private String unitName(Booking b) {
        return unitRepository.findById(b.getInfrastructureId()).map(Infrastructure::getName).orElse("unit");
    }

    private void logSession(Long ticketId, Long actorId, BookingStatus from, BookingStatus to, String note) {
        TicketHistory row = new TicketHistory();
        row.setTicketId(ticketId);
        row.setActorId(actorId);
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName("session");
        row.setFromValue(from.name());
        row.setToValue(to.name());
        row.setNote(cut(note, MAX_REASON));
        historyRepository.save(row);
    }

    // recompute the ticket status from its sessions. when the last pending one is decided, one summary bell
    private void finishDecision(Ticket ticket, TicketActor actor) {
        List<Booking> all = bookingRepository.findByTicketIdOrderByStartTimeAsc(ticket.getId());
        TicketStatus old = ticket.getStatus();
        TicketStatus next = BookingStatuses.resolve(all);
        if (next == null || next == old) {
            return;
        }
        ticket.setStatus(next);
        ticketRepository.saveAndFlush(ticket);

        TicketHistory row = new TicketHistory();
        row.setTicketId(ticket.getId());
        row.setActorId(actor.id());
        row.setAction(HistoryAction.UPDATED);
        row.setFieldName("status");
        row.setFromValue(old.name());
        row.setToValue(next.name());
        row.setNote("Every session has a decision");
        historyRepository.save(row);

        if (next == TicketStatus.PENDING_APPROVAL) {
            return;
        }
        long approved = all.stream().filter(x -> x.getStatus() == BookingStatus.APPROVED).count();
        String text;
        NotificationType kind = NotificationType.BOOKING_APPROVED;
        if (next == TicketStatus.APPROVED) {
            text = ticket.getTicketNo() + " (" + ticket.getTitle() + ") was approved";
        } else if (next == TicketStatus.PARTIALLY_APPROVED) {
            text = ticket.getTicketNo() + " (" + ticket.getTitle() + "): " + approved + " of "
                    + all.size() + " sessions approved";
        } else {
            kind = NotificationType.BOOKING_REJECTED;
            text = ticket.getTicketNo() + " (" + ticket.getTitle() + ") was rejected";
        }
        tell(ticket.getAuthorId(), actor.id(), kind, ticket.getId(), text);
    }  
    
    // ---------- helpers ----------

    private List<BookingResponseDto> toDtos(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return List.of();
        }
        Map<Long, Infrastructure> units = unitRepository
                .findAllById(bookings.stream().map(Booking::getInfrastructureId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Infrastructure::getId, Function.identity()));
        Set<Long> typeIds = units.values().stream().map(Infrastructure::getInfraTypeId).collect(Collectors.toSet());
        Map<Long, InfraType> types = typeRepository.findAllById(typeIds)
                .stream().collect(Collectors.toMap(InfraType::getId, Function.identity()));
        Map<Long, Ticket> tickets = ticketRepository
                .findAllById(bookings.stream().map(Booking::getTicketId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Ticket::getId, Function.identity()));

        return bookings.stream().map(b -> {
            Infrastructure unit = units.get(b.getInfrastructureId());
            InfraType kind = unit == null ? null : types.get(unit.getInfraTypeId());
            Ticket ticket = tickets.get(b.getTicketId());
            return new BookingResponseDto(
                    b.getId(), b.getTicketId(), ticket == null ? null : ticket.getTicketNo(),
                    b.getInfrastructureId(), unit == null ? "(removed)" : unit.getName(),
                    kind == null ? null : kind.getId(), kind == null ? "" : kind.getName(),
                    unit == null ? 0 : unit.getCapacity(),
                    b.getTitle(), b.getHeadcount(), b.getStartTime(), b.getEndTime(), b.isAllDay(),
                    b.getStatus(), b.getReason(), b.isOversize(), b.getDecidedOn(), b.getDecisionNote());
        }).toList();
    }

    private void tellAdmins(Long actorId, NotificationType type, Long ticketId, String message) {
        List<Long> admins = adminRepository.findIdsByRole(Role.ADMIN).stream()
                .filter(id -> !id.equals(actorId))
                .toList();
        if (!admins.isEmpty()) {
            notificationService.notifyUsers(admins, type, ticketId, cut(message, MAX_MESSAGE));
        }
    }

    private void tell(Long userId, Long actorId, NotificationType type, Long ticketId, String message) {
        if (userId == null || userId.equals(actorId)) {
            return;
        }
        notificationService.notifyUsers(List.of(userId), type, ticketId, cut(message, MAX_MESSAGE));
    }

    private String userName(Long userId) {
        return userRepository.findById(userId).map(User::getFullName).orElse("#" + userId);
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static String cut(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}