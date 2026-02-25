package com.peerreview.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Access(AccessType.FIELD)
public class NotificationItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(nullable = false)
    private String time;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public Boolean getRead() {
        return isRead;
    }

    public void setRead(Boolean read) {
        this.isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
