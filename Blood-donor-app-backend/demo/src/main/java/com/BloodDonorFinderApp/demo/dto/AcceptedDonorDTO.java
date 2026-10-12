package com.BloodDonorFinderApp.demo.dto;

import java.time.LocalDateTime;

public class AcceptedDonorDTO {

    private Long responseId;
    private Long donorId;
    private String name;
    private String email;
    private String phone;
    private String bloodGroup;
    private String location;
    private boolean available;
    private boolean verified;
    private int totalDonations;
    private String response;
    private LocalDateTime respondedAt;

    public AcceptedDonorDTO(
            Long responseId,
            Long donorId,
            String name,
            String email,
            String phone,
            String bloodGroup,
            String location,
            boolean available,
            boolean verified,
            int totalDonations,
            String response,
            LocalDateTime respondedAt
    ) {
        this.responseId = responseId;
        this.donorId = donorId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.bloodGroup = bloodGroup;
        this.location = location;
        this.available = available;
        this.verified = verified;
        this.totalDonations = totalDonations;
        this.response = response;
        this.respondedAt = respondedAt;
    }

    public Long getResponseId() {
        return responseId;
    }

    public Long getDonorId() {
        return donorId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public String getLocation() {
        return location;
    }

    public boolean isAvailable() {
        return available;
    }

    public boolean isVerified() {
        return verified;
    }

    public int getTotalDonations() {
        return totalDonations;
    }

    public String getResponse() {
        return response;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }
}