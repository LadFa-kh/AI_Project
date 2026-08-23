package com.example.backend.config;

import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;


import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    /**
     * ดึง user ที่ login อยู่จาก JWT (ที่อ่านมาจาก cookie แล้วโดย JwtAuthenticationFilter)
     * ปลอมไม่ได้ เพราะ token มีลายเซ็นกำกับ
     */
    public UserEntity getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("กรุณาเข้าสู่ระบบก่อนใช้งาน");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบข้อมูลผู้ใช้ที่เข้าสู่ระบบอยู่"));
    }

    public UUID getCurrentUserId(Authentication authentication) {
        return getCurrentUser(authentication).getId();
    }

}