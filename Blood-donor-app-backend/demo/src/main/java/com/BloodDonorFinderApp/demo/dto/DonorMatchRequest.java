package com.BloodDonorFinderApp.demo.dto;

import com.BloodDonorFinderApp.demo.validation.ValidBloodGroup;
import jakarta.validation.constraints.NotBlank;

public class DonorMatchRequest {

    @NotBlank(message = "Blood group is required")
    @ValidBloodGroup
    private String bloodGroup;

    private String location;
    private Double latitude;
    private Double longitude;
    private String urgency;
    private String patientName;
    private String hospitalName;
    private Integer units;

    public DonorMatchRequest() {
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
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

    public String getUrgency() {
        return urgency;
    }

    public void setUrgency(String urgency) {
        this.urgency = urgency;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }
}
