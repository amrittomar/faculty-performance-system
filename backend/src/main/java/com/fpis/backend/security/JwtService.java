package com.fpis.backend.security;

import com.fpis.backend.domain.Faculty;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;
    public JwtService(@Value("${fpis.jwt.secret}") String secret, @Value("${fpis.jwt.expiration-ms}") long expirationMs) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalArgumentException("fpis.jwt.secret must contain at least 32 bytes");
        if (expirationMs <= 0) throw new IllegalArgumentException("fpis.jwt.expiration-ms must be positive");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expirationMs = expirationMs;
    }
    public String issue(Faculty faculty) {
        long now = System.currentTimeMillis();
        return Jwts.builder().subject(faculty.getEmail()).claim("facultyId", faculty.getId()).claim("role", faculty.getRole().name())
          .issuedAt(new Date(now)).expiration(new Date(now + expirationMs)).signWith(key).compact();
    }
    public String subject(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
    }
    public long expirationMs() { return expirationMs; }
}
