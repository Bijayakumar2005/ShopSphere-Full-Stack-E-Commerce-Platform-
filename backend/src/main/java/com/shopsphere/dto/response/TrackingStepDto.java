package com.shopsphere.dto.response;

import java.time.LocalDateTime;

public class TrackingStepDto {

    private String status;
    private String title;
    private String description;
    private LocalDateTime timestamp;
    private String state; // COMPLETED, CURRENT, UPCOMING

    public TrackingStepDto() {
    }

    public TrackingStepDto(String status, String title, String description, LocalDateTime timestamp, String state) {
        this.status = status;
        this.title = title;
        this.description = description;
        this.timestamp = timestamp;
        this.state = state;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }
}
