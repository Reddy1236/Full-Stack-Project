package com.peerreview.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviewer_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "reviewer"})
})
public class ReviewerAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false)
    private String reviewer;

    @Column(nullable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getReviewer() {
        return reviewer;
    }

    public void setReviewer(String reviewer) {
        this.reviewer = reviewer;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
}
