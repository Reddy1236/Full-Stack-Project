package com.peerreview.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ReviewDtos {
    public record CreateReviewRequest(
            @NotBlank String reviewer,
            @NotNull @Min(1) @Max(5) Integer rating,
            @NotBlank String comment
    ) {
    }

    public record ReviewResponse(
            Long id,
            Long projectId,
            String reviewer,
            Integer rating,
            String comment,
            LocalDate date
    ) {
    }
}
