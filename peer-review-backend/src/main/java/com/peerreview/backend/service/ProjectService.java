package com.peerreview.backend.service;

import com.peerreview.backend.dto.PlatformDtos;
import com.peerreview.backend.dto.ProjectDtos;
import com.peerreview.backend.dto.ReviewDtos;
import com.peerreview.backend.model.*;
import com.peerreview.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("MMM d, h:mm a", Locale.ENGLISH);

    private final ProjectRepository projectRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewerAssignmentRepository assignmentRepository;
    private final TeacherDecisionRepository teacherDecisionRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityEventRepository activityEventRepository;
    private final ReviewReplyRepository reviewReplyRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            ReviewRepository reviewRepository,
            ReviewerAssignmentRepository assignmentRepository,
            TeacherDecisionRepository teacherDecisionRepository,
            NotificationRepository notificationRepository,
            ActivityEventRepository activityEventRepository,
            ReviewReplyRepository reviewReplyRepository
    ) {
        this.projectRepository = projectRepository;
        this.reviewRepository = reviewRepository;
        this.assignmentRepository = assignmentRepository;
        this.teacherDecisionRepository = teacherDecisionRepository;
        this.notificationRepository = notificationRepository;
        this.activityEventRepository = activityEventRepository;
        this.reviewReplyRepository = reviewReplyRepository;
    }

    public List<ProjectDtos.ProjectResponse> listProjects(String status, String search) {
        List<Project> projects;

        if (search != null && !search.isBlank()) {
            projects = projectRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(search, search);
        } else if (status != null && !status.isBlank()) {
            ProjectStatus parsed = ProjectStatus.valueOf(status.trim().toUpperCase());
            projects = projectRepository.findByStatus(parsed);
        } else {
            projects = projectRepository.findAll();
        }

        return projects.stream().map(this::toProjectResponse).toList();
    }

    public ProjectDtos.ProjectResponse createProject(ProjectDtos.CreateProjectRequest request) {
        Project project = new Project();
        project.setTitle(request.title().trim());
        project.setAuthor(request.author().trim());
        project.setDescription(request.description());
        project.setFiles(mapProjectFiles(request.files()));

        Project saved = projectRepository.save(project);
        addActivity(
                "Project uploaded",
                String.format("%s uploaded %s (%d files)", saved.getAuthor(), saved.getTitle(), saved.getFiles().size()),
                "upload",
                "project_uploaded",
                saved.getId(),
                saved.getTitle(),
                saved.getAuthor(),
                saved.getAuthor(),
                "student"
        );

        return toProjectResponse(saved);
    }

    public List<ReviewDtos.ReviewResponse> getReviews(Long projectId) {
        ensureProjectExists(projectId);
        return reviewRepository.findByProjectId(projectId).stream().map(this::toReviewResponse).toList();
    }

    @Transactional
    public ReviewDtos.ReviewResponse submitReview(Long projectId, ReviewDtos.CreateReviewRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found"));

        if (reviewRepository.existsByProjectIdAndReviewer(projectId, request.reviewer().trim())) {
            throw new IllegalArgumentException("You already submitted a review for this project");
        }

        Review review = new Review();
        review.setProject(project);
        review.setReviewer(request.reviewer().trim());
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        reviewRepository.save(review);

        updateProjectAverage(projectId);

        addNotification("review", String.format("%s submitted a review for %s", review.getReviewer(), project.getTitle()));
        addActivity(
                "Review received",
                String.format("%s reviewed %s with %d/5 stars", review.getReviewer(), project.getTitle(), review.getRating()),
                "star",
                "review_submitted",
                project.getId(),
                project.getTitle(),
                project.getAuthor(),
                review.getReviewer(),
                "student"
        );

        return toReviewResponse(review);
    }

    @Transactional
    public Map<String, List<String>> setAssignment(Long projectId, PlatformDtos.AssignmentRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found"));

        assignmentRepository.deleteByProjectId(projectId);

        List<String> reviewers = request.reviewers().stream()
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .distinct()
                .toList();

        for (String reviewer : reviewers) {
            ReviewerAssignment row = new ReviewerAssignment();
            row.setProject(project);
            row.setReviewer(reviewer);
            assignmentRepository.save(row);
        }

        addActivity(
                "Assigned reviewers",
                String.format("%d reviewers assigned to %s", reviewers.size(), project.getTitle()),
                "users",
                "reviewers_assigned",
                project.getId(),
                project.getTitle(),
                project.getAuthor(),
                "Teacher",
                "teacher"
        );
        addNotification("assignment", String.format("Reviewers assigned to project %s", project.getTitle()));

        return getAssignmentsMap();
    }

    @Transactional
    public PlatformDtos.TeacherDecisionResponse saveTeacherDecision(Long projectId, PlatformDtos.TeacherDecisionRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found"));

        TeacherDecision decision = teacherDecisionRepository.findByProjectId(projectId)
                .orElseGet(TeacherDecision::new);

        decision.setProject(project);
        decision.setAction(normalizeAction(request.action()));
        decision.setComment(request.comment().trim());
        decision.setFinalScore(request.finalScore());
        decision.setCompletionPercentage(request.completionPercentage());
        decision.setSubmittedAt(LocalDateTime.now());
        teacherDecisionRepository.save(decision);
        String teacherName = request.teacherName() != null && !request.teacherName().isBlank()
                ? request.teacherName().trim()
                : "Teacher";

        project.setFinalScore(request.finalScore());
        project.setCompletionPercentage(request.completionPercentage());
        project.setStatus(actionToStatus(decision.getAction()));
        project.setRating(Math.max(0, Math.min(5, Math.round((request.finalScore() / 20.0) * 10.0) / 10.0)));
        projectRepository.save(project);

        addActivity(
                "Teacher decision",
                String.format(
                        "%s graded %s (%s): %d/100, %s%% completion",
                        teacherName,
                        project.getTitle(),
                        decision.getAction().replace('_', ' '),
                        request.finalScore(),
                        request.completionPercentage()
                ),
                "clock",
                "teacher_decision",
                project.getId(),
                project.getTitle(),
                project.getAuthor(),
                teacherName,
                "teacher"
        );
        addNotification(
                "teacher",
                String.format("Teacher marked %s as %s. %s", project.getTitle(), decision.getAction().replace('_', ' '), decision.getComment())
        );

        return toTeacherDecisionResponse(decision);
    }

    @Transactional
    public PlatformDtos.ReviewReplyResponse addReviewReply(Long reviewId, PlatformDtos.ReviewReplyRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NoSuchElementException("Review not found"));

        ReviewReply reply = new ReviewReply();
        reply.setReview(review);
        reply.setAuthor(request.author().trim());
        reply.setText(request.text().trim());
        reply.setDate(displayNow());
        reviewReplyRepository.save(reply);

        addActivity(
                "Discussion updated",
                String.format("%s replied on %s", reply.getAuthor(), review.getProject().getTitle()),
                "users",
                "discussion_updated",
                review.getProject().getId(),
                review.getProject().getTitle(),
                review.getProject().getAuthor(),
                reply.getAuthor(),
                "student"
        );

        return toReviewReplyResponse(reply);
    }

    @Transactional
    public void markNotificationRead(Long notificationId) {
        NotificationItem item = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NoSuchElementException("Notification not found"));
        item.setRead(true);
        notificationRepository.save(item);
    }

    public PlatformDtos.PlatformStateResponse getPlatformState() {
        List<ProjectDtos.ProjectResponse> projects;
        try {
            projects = projectRepository.findAll().stream().map(this::toProjectResponse).toList();
        } catch (Exception ex) {
            projects = List.of();
        }

        List<ReviewDtos.ReviewResponse> reviews;
        try {
            reviews = reviewRepository.findAll().stream()
                    .filter(review -> review.getProject() != null && review.getProject().getId() != null)
                    .map(this::toReviewResponse)
                    .toList();
        } catch (Exception ex) {
            reviews = List.of();
        }

        Map<String, List<String>> assignments;
        try {
            assignments = getAssignmentsMap();
        } catch (Exception ex) {
            assignments = Map.of();
        }

        Map<String, PlatformDtos.TeacherDecisionResponse> teacherDecisions;
        try {
            teacherDecisions = teacherDecisionRepository.findAll().stream()
                    .filter(decision -> decision.getProject() != null && decision.getProject().getId() != null)
                    .collect(Collectors.toMap(
                            decision -> String.valueOf(decision.getProject().getId()),
                            this::toTeacherDecisionResponse,
                            (existing, replacement) -> replacement,
                            LinkedHashMap::new
                    ));
        } catch (Exception ex) {
            teacherDecisions = Map.of();
        }

        Map<String, List<PlatformDtos.ReviewReplyResponse>> reviewReplies;
        try {
            reviewReplies = reviewReplyRepository.findAll().stream()
                    .filter(reply -> reply.getReview() != null && reply.getReview().getId() != null)
                    .sorted(Comparator.comparing(ReviewReply::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .collect(Collectors.groupingBy(
                            reply -> String.valueOf(reply.getReview().getId()),
                            Collectors.mapping(this::toReviewReplyResponse, Collectors.toList())
                    ));
        } catch (Exception ex) {
            reviewReplies = Map.of();
        }

        List<PlatformDtos.NotificationResponse> notifications;
        try {
            notifications = notificationRepository.findAll().stream()
                    .sorted(Comparator.comparing(NotificationItem::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                    .map(this::toNotificationResponse)
                    .toList();
        } catch (Exception ex) {
            notifications = List.of();
        }

        List<PlatformDtos.ActivityResponse> activity;
        try {
            activity = activityEventRepository.findAll().stream()
                    .sorted(Comparator.comparing(ActivityEvent::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                    .map(this::toActivityResponse)
                    .toList();
        } catch (Exception ex) {
            activity = List.of();
        }

        return new PlatformDtos.PlatformStateResponse(
                projects,
                reviews,
                assignments,
                teacherDecisions,
                reviewReplies,
                notifications,
                activity
        );
    }

    private Map<String, List<String>> getAssignmentsMap() {
        return assignmentRepository.findAll().stream()
                .filter(row -> row.getProject() != null && row.getProject().getId() != null)
                .collect(Collectors.groupingBy(
                        row -> String.valueOf(row.getProject().getId()),
                        Collectors.mapping(ReviewerAssignment::getReviewer, Collectors.toList())
                ));
    }

    private void updateProjectAverage(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found"));

        List<Review> reviews = reviewRepository.findByProjectId(projectId);
        if (reviews.isEmpty()) {
            project.setRating(null);
            project.setStatus(ProjectStatus.PENDING_REVIEW);
        } else {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
            project.setRating(Math.round(avg * 10.0) / 10.0);
            if (project.getStatus() == ProjectStatus.PENDING_REVIEW) {
                project.setStatus(ProjectStatus.REVIEWED);
            }
        }
        projectRepository.save(project);
    }

    private void ensureProjectExists(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new NoSuchElementException("Project not found");
        }
    }

    private String normalizeAction(String action) {
        String value = action.trim().toLowerCase();
        if ("improve".equals(value)) {
            return "improvement_requested";
        }
        return value;
    }

    private ProjectStatus actionToStatus(String action) {
        return switch (normalizeAction(action)) {
            case "approve" -> ProjectStatus.APPROVED;
            case "reject" -> ProjectStatus.REJECTED;
            case "improvement_requested" -> ProjectStatus.IMPROVEMENT_REQUESTED;
            default -> ProjectStatus.REVIEWED;
        };
    }

    private void addNotification(String type, String message) {
        NotificationItem item = new NotificationItem();
        item.setType(type);
        item.setMessage(message);
        item.setTime(displayNow());
        notificationRepository.save(item);
    }

    private void addActivity(
            String action,
            String detail,
            String icon,
            String actionType,
            Long projectId,
            String projectTitle,
            String studentName,
            String actorName,
            String actorRole
    ) {
        ActivityEvent event = new ActivityEvent();
        event.setAction(action);
        event.setDetail(detail);
        event.setTime(displayNow());
        event.setIcon(icon);
        event.setActionType(actionType);
        event.setProjectId(projectId);
        event.setProjectTitle(projectTitle);
        event.setStudentName(studentName);
        event.setActorName(actorName);
        event.setActorRole(actorRole);
        activityEventRepository.save(event);
    }

    private List<FileAttachment> mapProjectFiles(List<ProjectDtos.ProjectFileRequest> files) {
        if (files == null) {
            return List.of();
        }
        return files.stream()
                .filter(Objects::nonNull)
                .map(file -> {
                    FileAttachment row = new FileAttachment();
                    row.setName(file.name() == null ? "" : file.name().trim());
                    row.setSize(file.size() == null ? 0L : Math.max(0L, file.size()));
                    return row;
                })
                .filter(file -> !file.getName().isBlank())
                .toList();
    }

    private String displayNow() {
        return LocalDateTime.now().format(DISPLAY_TIME);
    }

    private ProjectDtos.ProjectResponse toProjectResponse(Project project) {
        List<ProjectDtos.ProjectFileResponse> files = project.getFiles() == null
                ? List.of()
                : project.getFiles().stream()
                .map(file -> new ProjectDtos.ProjectFileResponse(file.getName(), file.getSize()))
                .toList();

        return new ProjectDtos.ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getAuthor(),
                project.getDescription(),
                project.getStatus(),
                project.getSubmittedAt(),
                project.getRating(),
                project.getFinalScore(),
                project.getCompletionPercentage(),
                files
        );
    }

    private ReviewDtos.ReviewResponse toReviewResponse(Review review) {
        return new ReviewDtos.ReviewResponse(
                review.getId(),
                review.getProject().getId(),
                review.getReviewer(),
                review.getRating(),
                review.getComment(),
                review.getDate()
        );
    }

    private PlatformDtos.TeacherDecisionResponse toTeacherDecisionResponse(TeacherDecision decision) {
        String submittedAt = decision.getSubmittedAt() != null ? decision.getSubmittedAt().toString() : null;

        return new PlatformDtos.TeacherDecisionResponse(
                decision.getAction(),
                decision.getComment(),
                decision.getFinalScore(),
                decision.getCompletionPercentage(),
                submittedAt
        );
    }

    private PlatformDtos.ReviewReplyResponse toReviewReplyResponse(ReviewReply reply) {
        return new PlatformDtos.ReviewReplyResponse(
                String.valueOf(reply.getId()),
                reply.getText(),
                reply.getAuthor(),
                reply.getDate()
        );
    }

    private PlatformDtos.NotificationResponse toNotificationResponse(NotificationItem item) {
        return new PlatformDtos.NotificationResponse(
                String.valueOf(item.getId()),
                item.getType(),
                item.getMessage(),
                item.getTime(),
                item.getRead()
        );
    }

    private PlatformDtos.ActivityResponse toActivityResponse(ActivityEvent event) {
        return new PlatformDtos.ActivityResponse(
                String.valueOf(event.getId()),
                event.getAction(),
                event.getDetail(),
                event.getTime(),
                event.getIcon(),
                event.getProjectId(),
                event.getProjectTitle(),
                event.getStudentName(),
                event.getActorName(),
                event.getActorRole(),
                event.getActionType()
        );
    }
}
