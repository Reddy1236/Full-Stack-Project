package com.peerreview.backend.repository;

import com.peerreview.backend.model.NotificationItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationItem, Long> {
}
