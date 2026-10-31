package com.fixhub.infra.controller;

import com.fixhub.common.auth.security.AuthUser;
import com.fixhub.common.dto.ApiResponse;
import com.fixhub.infra.dto.BookingResponseDto;
import com.fixhub.infra.dto.InfraTypeDto;
import com.fixhub.infra.dto.InfraTypeRequestDto;
import com.fixhub.infra.dto.InfrastructureDto;
import com.fixhub.infra.dto.InfrastructureRequestDto;
import com.fixhub.infra.dto.SessionCancelRequestDto;
import com.fixhub.infra.service.BookingService;
import com.fixhub.infra.service.InfraCatalogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin only. SecurityConfig already locks /api/admin/** to ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin/infra")
public class InfraAdminController {

    private final InfraCatalogService catalogService;
    private final BookingService bookingService;

    public InfraAdminController(InfraCatalogService catalogService, BookingService bookingService) {
        this.catalogService = catalogService;
        this.bookingService = bookingService;
    }

    // ---------- kinds ----------

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<InfraTypeDto>>> types() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listTypes(true)));
    }

    @PostMapping("/types")
    public ResponseEntity<ApiResponse<InfraTypeDto>> createType(@RequestBody InfraTypeRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kind created", catalogService.createType(request)));
    }

    @PutMapping("/types/{id}")
    public ResponseEntity<ApiResponse<InfraTypeDto>> updateType(@PathVariable Long id,
                                                                @RequestBody InfraTypeRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Kind updated", catalogService.updateType(id, request)));
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        catalogService.deleteType(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- units ----------

    @GetMapping("/types/{typeId}/units")
    public ResponseEntity<ApiResponse<List<InfrastructureDto>>> units(@PathVariable Long typeId) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listUnits(typeId)));
    }

    @PostMapping("/units")
    public ResponseEntity<ApiResponse<InfrastructureDto>> createUnit(@RequestBody InfrastructureRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Unit created", catalogService.createUnit(request)));
    }

    @PutMapping("/units/{id}")
    public ResponseEntity<ApiResponse<InfrastructureDto>> updateUnit(@PathVariable Long id,
                                                                     @RequestBody InfrastructureRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Unit updated", catalogService.updateUnit(id, request)));
    }

    @DeleteMapping("/units/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long id) {
        catalogService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- one session ----------

    // cancel one session with a reason. the last one gone cancels the ticket
    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<BookingResponseDto>> cancelSession(
            @PathVariable Long bookingId,
            @RequestBody SessionCancelRequestDto request,
            @AuthenticationPrincipal AuthUser user,
            Authentication authentication) {
        BookingResponseDto cancelled = bookingService.cancelSession(
                bookingId, request == null ? null : request.note(), InfraActors.of(user, authentication));
        return ResponseEntity.ok(ApiResponse.success("Session cancelled", cancelled));
    }
}