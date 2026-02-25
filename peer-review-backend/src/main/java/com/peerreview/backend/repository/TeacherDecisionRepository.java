package com.peerreview.backend.repository;

import com.peerreview.backend.model.TeacherDecision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherDecisionRepository extends JpaRepository<TeacherDecision, Long> {
    Optional<TeacherDecision> findByProjectId(Long projectId);
}
