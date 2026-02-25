package com.peerreview.backend.controller;

import com.peerreview.backend.dto.PlatformDtos;
import com.peerreview.backend.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PlatformController {
    private final ProjectService projectService;

    public PlatformController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/platform/state")
    public PlatformDtos.PlatformStateResponse getPlatformState() {
        return projectService.getPlatformState();
    }

    @PostMapping("/reviews/{reviewId}/replies")
    public PlatformDtos.ReviewReplyResponse addReviewReply(
            @PathVariable Long reviewId,
            @Valid @RequestBody PlatformDtos.ReviewReplyRequest request
    ) {
        return projectService.addReviewReply(reviewId, request);
    }

    @PatchMapping("/notifications/{notificationId}/read")
    public void markNotificationRead(@PathVariable Long notificationId) {
        projectService.markNotificationRead(notificationId);
    }
}
