package com.BloodDonorFinderApp.demo.dto;

public class EmergencyPriorityResult {

    private Long requestId;
    private String priorityLevel;
    private double priorityScore;
    private String reason;

    public EmergencyPriorityResult() {
    }

    public EmergencyPriorityResult(
            Long requestId,
            String priorityLevel,
            double priorityScore,
            String reason
    ) {
        this.requestId = requestId;
        this.priorityLevel = priorityLevel;
        this.priorityScore = priorityScore;
        this.reason = reason;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getPriorityLevel() {
        return priorityLevel;
    }

    public void setPriorityLevel(String priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public double getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(double priorityScore) {
        this.priorityScore = priorityScore;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}