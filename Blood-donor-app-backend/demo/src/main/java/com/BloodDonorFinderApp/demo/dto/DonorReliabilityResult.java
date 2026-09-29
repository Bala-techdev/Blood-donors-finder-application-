package com.BloodDonorFinderApp.demo.dto;

public class DonorReliabilityResult {

    private Long donorId;

    private double reliabilityScore;

    private String reliabilityLevel;

    private int totalRecommendations;

    private int respondedCount;

    private int acceptedCount;

    private int declinedCount;

    private int pendingCount;

    private double responseRate;

    private double acceptanceRate;

    private String explanation;


    public DonorReliabilityResult() {
    }


    public DonorReliabilityResult(
            Long donorId,
            double reliabilityScore,
            String reliabilityLevel,
            int totalRecommendations,
            int respondedCount,
            int acceptedCount,
            int declinedCount,
            int pendingCount,
            double responseRate,
            double acceptanceRate,
            String explanation
    ) {

        this.donorId = donorId;
        this.reliabilityScore = reliabilityScore;
        this.reliabilityLevel = reliabilityLevel;
        this.totalRecommendations = totalRecommendations;
        this.respondedCount = respondedCount;
        this.acceptedCount = acceptedCount;
        this.declinedCount = declinedCount;
        this.pendingCount = pendingCount;
        this.responseRate = responseRate;
        this.acceptanceRate = acceptanceRate;
        this.explanation = explanation;
    }


    public Long getDonorId() {
        return donorId;
    }

    public void setDonorId(Long donorId) {
        this.donorId = donorId;
    }


    public double getReliabilityScore() {
        return reliabilityScore;
    }

    public void setReliabilityScore(double reliabilityScore) {
        this.reliabilityScore = reliabilityScore;
    }


    public String getReliabilityLevel() {
        return reliabilityLevel;
    }

    public void setReliabilityLevel(String reliabilityLevel) {
        this.reliabilityLevel = reliabilityLevel;
    }


    public int getTotalRecommendations() {
        return totalRecommendations;
    }

    public void setTotalRecommendations(int totalRecommendations) {
        this.totalRecommendations = totalRecommendations;
    }


    public int getRespondedCount() {
        return respondedCount;
    }

    public void setRespondedCount(int respondedCount) {
        this.respondedCount = respondedCount;
    }


    public int getAcceptedCount() {
        return acceptedCount;
    }

    public void setAcceptedCount(int acceptedCount) {
        this.acceptedCount = acceptedCount;
    }


    public int getDeclinedCount() {
        return declinedCount;
    }

    public void setDeclinedCount(int declinedCount) {
        this.declinedCount = declinedCount;
    }


    public int getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(int pendingCount) {
        this.pendingCount = pendingCount;
    }


    public double getResponseRate() {
        return responseRate;
    }

    public void setResponseRate(double responseRate) {
        this.responseRate = responseRate;
    }


    public double getAcceptanceRate() {
        return acceptanceRate;
    }

    public void setAcceptanceRate(double acceptanceRate) {
        this.acceptanceRate = acceptanceRate;
    }


    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}