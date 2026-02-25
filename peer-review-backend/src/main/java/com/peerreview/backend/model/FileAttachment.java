package com.peerreview.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class FileAttachment {
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Long size = 0L;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }
}
