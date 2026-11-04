package com.fpis.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthContext {
    private AuthContext() {}
    public static AppPrincipal principal() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !(a.getPrincipal() instanceof AppPrincipal p)) throw new IllegalStateException("Authenticated faculty context is unavailable");
        return p;
    }
    public static Long facultyId() { return principal().facultyId(); }
    public static String email() { return principal().email(); }
}
