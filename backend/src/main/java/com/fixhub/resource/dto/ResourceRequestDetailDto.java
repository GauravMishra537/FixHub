package com.fixhub.resource.dto;

import com.fixhub.resource.entity.ItemKind;
import com.fixhub.resource.entity.RequestStatus;

import java.time.Instant;
import java.time.LocalDate;

/** Everything the Request card on the ticket page shows. Names are empty when the thing was removed. */
public record ResourceRequestDetailDto(
        Long ticketId,
        String ticketNo,
        Long itemId,
        String itemName,
        ItemKind kind,
        String categoryName,
        String groupName,
        int quantity,
        String reason,
        LocalDate neededBy,
        RequestStatus status,
        boolean holding,
        String departmentName,
        Long approverId,
        String approverName,
        String deptDecidedByName,
        Instant deptDecidedOn,
        String deptNote,
        String adminDecidedByName,
        Instant adminDecidedOn,
        String adminNote) {
}