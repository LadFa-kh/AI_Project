package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "accessToken";

    // 15 นาที — ให้ตรงกับอายุ JWT ใน JwtTokenProvider
    private static final long ACCESS_TOKEN_MAX_AGE_SECONDS = 900;

    // dev (http://localhost) ต้องเป็น false ไม่งั้นเบราว์เซอร์ไม่ยอมเก็บ cookie
    // production (https) ต้องเป็น true
    @Value("${app.cookie.secure:false}")
    private boolean secure;

    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

    public ResponseCookie createAccessTokenCookie(String token) {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)          // JavaScript อ่านไม่ได้ = กัน XSS ขโมย token
                .secure(secure)
                .path("/")
                .maxAge(ACCESS_TOKEN_MAX_AGE_SECONDS)
                .sameSite(sameSite)
                .build();
    }

    /** cookie อายุ 0 = สั่งให้เบราว์เซอร์ลบทิ้ง ใช้ตอน logout */
    public ResponseCookie createLogoutCookie() {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();
    }
}