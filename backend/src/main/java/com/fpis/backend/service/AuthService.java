package com.fpis.backend.service;

import com.fpis.backend.domain.Faculty;
import com.fpis.backend.dto.ApiDtos.*;
import com.fpis.backend.repository.FacultyRepository;
import com.fpis.backend.security.JwtService;
import org.springframework.security.authentication.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthenticationManager manager; private final FacultyRepository faculty; private final JwtService jwt;
    public AuthService(AuthenticationManager manager, FacultyRepository faculty, JwtService jwt) { this.manager=manager; this.faculty=faculty; this.jwt=jwt; }
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        manager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        Faculty f = faculty.findByEmailIgnoreCase(request.email()).orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        return new AuthResponse(jwt.issue(f), "Bearer", jwt.expirationMs(), f.getEmail(), f.getRole(),
            f.getFullName(), f.getJobTitle(), f.getDepartment().getName());
    }
}
