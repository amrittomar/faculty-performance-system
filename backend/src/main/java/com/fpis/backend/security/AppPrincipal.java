package com.fpis.backend.security;

import com.fpis.backend.domain.Faculty;
import com.fpis.backend.domain.Role;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;

public final class AppPrincipal extends org.springframework.security.core.userdetails.User {
    private final Long facultyId;
    private final Role role;

    public AppPrincipal(Long facultyId, String email, String password, Role role, boolean enabled) {
        super(email, password, enabled, true, true, true, List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));
        this.facultyId = facultyId;
        this.role = role;
    }
    public static AppPrincipal from(Faculty f) { return new AppPrincipal(f.getId(), f.getEmail(), f.getPasswordHash(), f.getRole(), f.isActive()); }
    public Long facultyId() { return facultyId; }
    public String email() { return getUsername(); }
    public Role role() { return role; }
}
