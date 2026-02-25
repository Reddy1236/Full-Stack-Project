package com.peerreview.backend.controller;

import com.peerreview.backend.dto.PlatformDtos;
import com.peerreview.backend.dto.ProjectDtos;
import com.peerreview.backend.dto.ReviewDtos;
import com.peerreview.backend.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectDtos.ProjectResponse> listProjects(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return projectService.listProjects(status, search);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDtos.ProjectResponse createProject(@Valid @RequestBody ProjectDtos.CreateProjectRequest request) {
        return projectService.createProject(request);
    }

    @GetMapping("/{projectId}/reviews")
    public List<ReviewDtos.ReviewResponse> getReviews(@PathVariable Long projectId) {
        return projectService.getReviews(projectId);
    }

    @PostMapping("/{projectId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDtos.ReviewResponse submitReview(
            @PathVariable Long projectId,
            @Valid @RequestBody ReviewDtos.CreateReviewRequest request
    ) {
        return projectService.submitReview(projectId, request);
    }

    @PostMapping("/{projectId}/assign-reviewers")
    public java.util.Map<String, java.util.List<String>> assignReviewers(
            @PathVariable Long projectId,
            @Valid @RequestBody PlatformDtos.AssignmentRequest request
    ) {
        return projectService.setAssignment(projectId, request);
    }

    @PostMapping("/{projectId}/feedback")
    public PlatformDtos.TeacherDecisionResponse saveTeacherDecision(
            @PathVariable Long projectId,
            @Valid @RequestBody PlatformDtos.TeacherDecisionRequest request
    ) {
        return projectService.saveTeacherDecision(projectId, request);
    }
}
