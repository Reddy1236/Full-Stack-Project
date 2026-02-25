package com.peerreview.backend.repository;

import com.peerreview.backend.model.ActivityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, Long> {
}
