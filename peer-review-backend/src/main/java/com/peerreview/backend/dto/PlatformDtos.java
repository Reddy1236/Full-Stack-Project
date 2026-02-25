package com.peerreview.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public class PlatformDtos {

    public record AssignmentRequest(@NotEmpty List<@NotBlank String> reviewers) {
    }

    public record TeacherDecisionRequest(
            @NotBlank String action,
            @NotBlank String comment,
            @NotNull @Min(0) @Max(100) Integer finalScore,
            @NotNull @Min(0) @Max(100) Integer completionPercentage,
            String submittedAt,
            String teacherName
    ) {
    }

    public record ReviewReplyRequest(
            @NotBlank String text,
            @NotBlank String author
    ) {
    }

    public record NotificationResponse(
            String id,
            String type,
            String message,
            String time,
            Boolean read
    ) {
    }

    public record ActivityResponse(
            String id,
            String action,
            String detail,
            String time,
            String icon,
            Long projectId,
            String projectTitle,
            String studentName,
            String actorName,
            String actorRole,
            String actionType
    ) {
    }

    public record ReviewReplyResponse(
            String id,
            String text,
            String author,
            String date
    ) {
    }

    public record TeacherDecisionResponse(
            String action,
            String comment,
            Integer finalScore,
            Integer completionPercentage,
            String submittedAt
    ) {
    }

    public record PlatformStateResponse(
            List<ProjectDtos.ProjectResponse> projects,
            List<ReviewDtos.ReviewResponse> reviews,
            Map<String, List<String>> assignments,
            Map<String, TeacherDecisionResponse> teacherDecisions,
            Map<String, List<ReviewReplyResponse>> reviewReplies,
            List<NotificationResponse> notifications,
            List<ActivityResponse> activityTimeline
    ) {
    }
}
