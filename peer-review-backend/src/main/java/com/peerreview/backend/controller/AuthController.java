package com.peerreview.backend.controller;

import com.peerreview.backend.dto.AuthDtos;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public AuthDtos.RegisterResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User newUser = new User();
        newUser.setEmail(request.email().trim().toLowerCase());
        newUser.setPassword(request.password());
        newUser.setName(request.name().trim());
        newUser.setRole(request.role());

        User saved = userRepository.save(newUser);
        AuthDtos.AuthResponse registeredUser = new AuthDtos.AuthResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getName(),
                saved.getRole()
        );
        return new AuthDtos.RegisterResponse("Successfully registered. Please login with the same credentials.", registeredUser);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (user.getPassword() == null || !user.getPassword().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return new AuthDtos.AuthResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}
