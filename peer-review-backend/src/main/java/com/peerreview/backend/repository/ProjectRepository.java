package com.peerreview.backend.repository;

import com.peerreview.backend.model.Project;
import com.peerreview.backend.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStatus(ProjectStatus status);
    List<Project> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);
}
