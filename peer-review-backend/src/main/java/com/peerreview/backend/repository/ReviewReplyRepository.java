package com.peerreview.backend.repository;

import com.peerreview.backend.model.ReviewReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {
    List<ReviewReply> findByReviewId(Long reviewId);
}
