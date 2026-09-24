package com.example.backend.user.service;

import com.example.backend.handle.jwt.JwtTokenProvider;
import com.example.backend.user.dto.request.GoogleLoginRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;

@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleIdTokenVerifier verifier;

    public GoogleAuthService(UserRepository userRepository,
                             JwtTokenProvider jwtTokenProvider,
                             @Value("${google.oauth.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    @Transactional
    public AuthenticationResponseDto loginWithGoogle(GoogleLoginRequestDto request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new IllegalArgumentException("ต้องระบุ idToken จาก Google");
        }

        // 1. Verify token กับ Google — กันคนปลอม token ส่งมาเอง
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(request.getIdToken());
        } catch (Exception e) {
            throw new IllegalArgumentException("ไม่สามารถตรวจสอบ Google token ได้");
        }

        if (idToken == null) {
            throw new IllegalArgumentException("Google token ไม่ถูกต้องหรือหมดอายุแล้ว");
        }

        // 2. ดึงข้อมูลจาก token ที่ verify แล้ว
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String googleId = payload.getSubject();
        String fullName = (String) payload.get("name");
        Boolean emailVerified = payload.getEmailVerified();

        if (emailVerified == null || !emailVerified) {
            throw new IllegalArgumentException("อีเมล Google นี้ยังไม่ได้ยืนยัน");
        }

        // 3. หา user เดิม หรือสร้างใหม่ถ้ายังไม่เคยมี
        UserEntity user = userRepository.findByEmail(email)
                .map(existing -> linkGoogleAccountIfNeeded(existing, googleId))
                .orElseGet(() -> createGoogleUser(email, googleId, fullName));

        com.example.backend.user.account.AccountGuard.requireActive(user); // B5

        // 4. ออก JWT ของระบบเราเอง — เหมือน login ปกติทุกอย่าง
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthenticationResponseDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                accessToken,
                refreshToken
        );
    }

    /**
     * ถ้า email นี้เคยสมัครด้วย password ไว้แล้ว → ผูก googleId เข้ากับ account เดิม
     * ให้ login ได้ทั้ง 2 ทาง ไม่ต้องสร้าง account ซ้ำ
     */
    private UserEntity linkGoogleAccountIfNeeded(UserEntity existing, String googleId) {
        if (existing.getGoogleId() == null) {
            existing.setGoogleId(googleId);
            userRepository.save(existing);
        }
        return existing;
    }

    private UserEntity createGoogleUser(String email, String googleId, String fullName) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFullName(fullName != null ? fullName : email);
        user.setGoogleId(googleId);
        user.setAuthProvider(UserEntity.AuthProvider.GOOGLE);
        user.setPasswordHash(null);   // ไม่มี password เพราะ login ผ่าน Google
        user.setRole(UserEntity.Role.STUDENT);
        user.setCreatedAt(Instant.now());
        return userRepository.save(user);
    }
}