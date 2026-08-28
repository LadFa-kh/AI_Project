package com.example.backend.handle.jwt;

import com.example.backend.user.entity.UserEntity;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // คีย์ลับสำหรับเซ็นต์ JWT (ควรเก็บไว้ใน application.yml แต่อันนี้เขียนจำลองไว้ก่อน)
    private final String jwtSecret = "your-very-secure-and-long-secret-key-that-is-at-least-256-bits";
    private final long jwtAccessTokenExpirationInMs = 900000; // 15 นาที
    private final long jwtRefreshTokenExpirationInMs = 604800000; // 7 วัน

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // สร้าง Access Token
    public String generateAccessToken(UserEntity user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtAccessTokenExpirationInMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(UserEntity user) {
        return java.util.UUID.randomUUID().toString();
    }

    // ตรวจสอบความถูกต้องของ Access Token
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith((javax.crypto.SecretKey) getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ดึง Email จาก Token
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    // ดึง Role จาก Token
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("role", String.class);
    }
}