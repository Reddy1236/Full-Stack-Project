package com.peerreview.backend.repository;

import com.peerreview.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProjectId(Long projectId);
    boolean existsByProjectIdAndReviewer(Long projectId, String reviewer);
}
