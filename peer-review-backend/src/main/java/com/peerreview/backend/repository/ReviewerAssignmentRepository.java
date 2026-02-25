package com.peerreview.backend.repository;

import com.peerreview.backend.model.ReviewerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewerAssignmentRepository extends JpaRepository<ReviewerAssignment, Long> {
    List<ReviewerAssignment> findByProjectId(Long projectId);
    void deleteByProjectId(Long projectId);
}
