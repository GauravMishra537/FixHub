package com.fixhub.infra.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.infra.dto.AvailabilityDto;
import com.fixhub.infra.dto.BookingGroupDto;
import com.fixhub.infra.dto.BookingRequestDto;
import com.fixhub.infra.dto.BookingResponseDto;
import com.fixhub.infra.dto.InfraTypeDto;
import com.fixhub.infra.service.AvailabilityService;
import com.fixhub.infra.service.BookingService;
import com.fixhub.infra.service.InfraCatalogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/** Any logged in user. anyRequest().authenticated() already protects it. */
@RestController
@RequestMapping("/api/infra")
public class InfraController {

    private final InfraCatalogService catalogService;
    private final AvailabilityService availabilityService;
    private final BookingService bookingService;

    public InfraController(InfraCatalogService catalogService,
                           AvailabilityService availabilityService,
                           BookingService bookingService) {
        this.catalogService = catalogService;
        this.availabilityService = availabilityService;
        this.bookingService = bookingService;
    }

    // the cards on the booking page: switched on kinds only
    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<InfraTypeDto>>> types() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listTypes(false)));
    }

    // free units of one kind for one window, fitted to the headcount.
    // start and end are ISO instants, like 2026-11-02T04:30:00Z
    @GetMapping("/availability")
    public ResponseEntity<ApiResponse<AvailabilityDto>> availability(
            @RequestParam Long infraTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            @RequestParam int headcount,
            @RequestParam(defaultValue = "false") boolean includeBigger) {
        return ResponseEntity.ok(ApiResponse.success(
                availabilityService.search(infraTypeId, start, end, headcount, includeBigger)));
    }

    // the form: one ticket, one or more sessions
    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<BookingGroupDto>> create(
            @RequestBody BookingRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        BookingGroupDto created = bookingService.create(request, InfraActors.of(user, authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking requested", created));
    }

    // the sessions card on the ticket page. author and admins only
    @GetMapping("/tickets/{ticketId}/sessions")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> sessions(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                bookingService.getSessions(ticketId, InfraActors.of(user, authentication))));
    }
}