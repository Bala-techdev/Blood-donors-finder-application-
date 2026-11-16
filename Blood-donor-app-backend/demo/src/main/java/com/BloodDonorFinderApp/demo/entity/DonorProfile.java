package com.BloodDonorFinderApp.demo.entity;

import com.BloodDonorFinderApp.demo.validation.ValidBloodGroup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

@Entity
@Table(
        name = "donor_profiles",
        indexes = {
                @Index(name = "idx_donor_blood_group", columnList = "bloodGroup"),
                @Index(name = "idx_donor_location", columnList = "location"),
                @Index(name = "idx_donor_available", columnList = "available"),
                @Index(name = "idx_donor_last_donation", columnList = "lastDonationDate"),
                @Index(name = "idx_donor_search_composite", columnList = "bloodGroup, location, available"),
                @Index(name = "idx_donor_lat_long", columnList = "latitude, longitude")
        }
)
public class DonorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotBlank(message = "Blood group is required")
    @ValidBloodGroup
    @Column(nullable = false)
    private String bloodGroup;

    private String gender;

    private LocalDate dateOfBirth;

    @NotBlank(message = "Location is required")
    private String location;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private boolean available = true;

    private LocalDate lastDonationDate;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(nullable = false)
    private Integer totalDonations = 0;

    public DonorProfile() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public LocalDate getLastDonationDate() {
        return lastDonationDate;
    }

    public void setLastDonationDate(LocalDate lastDonationDate) {
        this.lastDonationDate = lastDonationDate;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public Integer getTotalDonations() {
        return totalDonations;
    }

    public void setTotalDonations(Integer totalDonations) {
        this.totalDonations = totalDonations;
    }
}