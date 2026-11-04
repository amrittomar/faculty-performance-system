package com.fpis.backend.security;

import com.fpis.backend.repository.FacultyRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class FacultyUserDetailsService implements UserDetailsService {
    private final FacultyRepository faculty;
    public FacultyUserDetailsService(FacultyRepository faculty) { this.faculty = faculty; }
    @Override public UserDetails loadUserByUsername(String username) {
        return faculty.findByEmailIgnoreCase(username).map(AppPrincipal::from)
          .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
    }
}
