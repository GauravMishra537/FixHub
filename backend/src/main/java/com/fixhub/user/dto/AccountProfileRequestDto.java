package com.fixhub.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AccountProfileRequestDto {

    @Size(max = 20, message = "Phone must be at most 20 characters")
    @Pattern(regexp = "^$|^[0-9+()\\-\\s]{6,20}$", message = "Phone can have digits, +, -, spaces, brackets only")
    private String phoneNumber;

    @Size(max = 100, message = "Work location must be at most 100 characters")
    private String workLocation;

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }
}