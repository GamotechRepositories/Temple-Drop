package com.templedrop.controller;

import com.templedrop.dto.AuthDtos;
import com.templedrop.security.AuthenticatedUser;
import com.templedrop.security.SessionAuthFilter;
import com.templedrop.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.AuthResponse register(
        @Valid @RequestBody AuthDtos.RegisterRequest req,
        HttpServletResponse response
    ) {
        return authService.register(req, response);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(
        @Valid @RequestBody AuthDtos.LoginRequest req,
        HttpServletResponse response
    ) {
        return authService.login(req, response);
    }

    @PostMapping("/guest")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.AuthResponse guest(HttpServletResponse response) {
        return authService.guestLogin(response);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = SessionAuthFilter.extractSessionToken(request);
        authService.logout(token, response);
        return Map.of("message", "Successfully logged out");
    }

    @GetMapping("/me")
    public AuthDtos.AuthResponse me(@AuthenticationPrincipal AuthenticatedUser authUser) {
        return authService.me(authUser.user(), authUser.userObjectId());
    }
}
