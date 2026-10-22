package com.fixhub.ticket.mapper;

import com.fixhub.ticket.dto.TicketHistoryResponseDto;
import com.fixhub.ticket.dto.TicketListItemDto;
import com.fixhub.ticket.dto.TicketResponseDto;
import com.fixhub.ticket.entity.Ticket;
import com.fixhub.ticket.entity.TicketHistory;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class TicketMapper {

    /** Names looked up once for a whole page, so a list does not hit the DB per row. */
    public record Names(Map<Long, String> users,
                        Map<Long, String> categories,
                        Map<Long, String> departments) {
    }

    private static final String FORMER_USER = "Former user";

    public TicketResponseDto toResponse(Ticket t, Names names, boolean canEdit) {
        TicketResponseDto dto = new TicketResponseDto();
        dto.setId(t.getId());
        dto.setTicketNo(t.getTicketNo());
        dto.setType(t.getType());
        dto.setTitle(t.getTitle());
        dto.setDescription(t.getDescription());
        dto.setStatus(t.getStatus());
        dto.setPriority(t.getPriority());
        dto.setVisibility(t.getVisibility());

        dto.setRequesterId(t.getRequesterId());
        dto.setRequesterName(names.users().getOrDefault(t.getRequesterId(), FORMER_USER));
        dto.setAssigneeId(t.getAssigneeId());
        if (t.getAssigneeId() != null) {
            dto.setAssigneeName(names.users().getOrDefault(t.getAssigneeId(), FORMER_USER));
        }

        dto.setCategoryId(t.getCategoryId());
        if (t.getCategoryId() != null) {
            dto.setCategoryName(names.categories().get(t.getCategoryId()));
        }
        dto.setDepartmentId(t.getDepartmentId());
        if (t.getDepartmentId() != null) {
            dto.setDepartmentName(names.departments().get(t.getDepartmentId()));
        }

        dto.setResolvedOn(t.getResolvedOn());
        dto.setClosedOn(t.getClosedOn());
        dto.setReopenCount(t.getReopenCount());
        dto.setVersion(t.getVersion());
        dto.setCreatedOn(t.getCreatedOn());
        dto.setUpdatedOn(t.getUpdatedOn());
        dto.setCanEdit(canEdit);
        return dto;
    }

    public TicketListItemDto toListItem(Ticket t, Names names) {
        TicketListItemDto dto = new TicketListItemDto();
        dto.setId(t.getId());
        dto.setTicketNo(t.getTicketNo());
        dto.setType(t.getType());
        dto.setTitle(t.getTitle());
        dto.setStatus(t.getStatus());
        dto.setPriority(t.getPriority());
        dto.setRequesterId(t.getRequesterId());
        dto.setRequesterName(names.users().getOrDefault(t.getRequesterId(), FORMER_USER));
        if (t.getAssigneeId() != null) {
            dto.setAssigneeName(names.users().getOrDefault(t.getAssigneeId(), FORMER_USER));
        }
        if (t.getCategoryId() != null) {
            dto.setCategoryName(names.categories().get(t.getCategoryId()));
        }
        dto.setCreatedOn(t.getCreatedOn());
        return dto;
    }

    public TicketHistoryResponseDto toHistory(TicketHistory h, Map<Long, String> users) {
        TicketHistoryResponseDto dto = new TicketHistoryResponseDto();
        dto.setId(h.getId());
        dto.setAction(h.getAction());
        dto.setFieldName(h.getFieldName());
        dto.setFromValue(h.getFromValue());
        dto.setToValue(h.getToValue());
        dto.setNote(h.getNote());
        dto.setActorId(h.getActorId());
        dto.setActorName(h.getActorId() == null ? "System" : users.getOrDefault(h.getActorId(), FORMER_USER));
        dto.setCreatedOn(h.getCreatedOn());
        return dto;
    }
}