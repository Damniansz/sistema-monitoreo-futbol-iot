package com.aldo.football_monitor.identity.controller;

import com.aldo.football_monitor.identity.dto.AuthenticationRequest;
import com.aldo.football_monitor.identity.dto.AuthenticationResponse;
import com.aldo.football_monitor.identity.dto.RegisterRequest;
import com.aldo.football_monitor.identity.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }
}
