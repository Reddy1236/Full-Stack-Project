package com.peerreview.backend.dto;

import com.peerreview.backend.model.ProjectStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public class ProjectDtos {
    public record CreateProjectRequest(
            @NotBlank String title,
            @NotBlank String author,
            String description,
            List<ProjectFileRequest> files
    ) {
    }

    public record ProjectFileRequest(
            @NotBlank String name,
            Long size
    ) {
    }

    public record ProjectFileResponse(
            String name,
            Long size
    ) {
    }

    public record ProjectResponse(
            Long id,
            String title,
            String author,
            String description,
            ProjectStatus status,
            LocalDate submittedAt,
            Double rating,
            Integer finalScore,
            Integer completionPercentage,
            List<ProjectFileResponse> files
    ) {
    }
}
