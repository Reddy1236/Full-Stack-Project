package com.peerreview.backend.dto;

import com.peerreview.backend.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AuthDtos {
    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String name,
            @NotNull Role role
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record RegisterResponse(String message, AuthResponse user) {
    }

    public record AuthResponse(Long id, String email, String name, Role role) {
    }
}
