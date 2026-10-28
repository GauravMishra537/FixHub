package com.fixhub.ticket.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PartLinksRequestDto {

    // part numbers start at 1
    @NotEmpty
    private List<Integer> partNumbers;
}