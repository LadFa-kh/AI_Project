package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE = "accessToken";

    // อายุ cookie ต้องเท่ากับอายุ JWT เสมอ ไม่งั้นจะเกิดอาการอย่างใดอย่างหนึ่ง:
    // cookie ตายก่อน = ผู้ใช้หลุดทั้งที่ token ยังไม่หมดอายุ / JWT ตายก่อน =
    // เบราว์เซอร์ยังส่ง cookie ที่ใช้ไม่ได้แล้วไปเรื่อย ๆ แล้วโดน 401
    // จึงอ่านจาก property ตัวเดียวกับ JwtTokenProvider แล้วหารพันเป็นวินาที
    @Value("${app.jwt.access-token-expiration-ms:86400000}")
    private long accessTokenExpirationMs;

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
                .maxAge(accessTokenExpirationMs / 1000)
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