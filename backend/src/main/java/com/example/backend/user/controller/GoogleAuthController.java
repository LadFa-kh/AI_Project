package com.example.backend.user.controller;

import com.example.backend.config.CookieUtil;
import com.example.backend.handle.ApiResponse;
import com.example.backend.user.dto.request.GoogleLoginRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.service.GoogleAuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;
    private final CookieUtil cookieUtil;

    public GoogleAuthController(GoogleAuthService googleAuthService, CookieUtil cookieUtil) {
        this.googleAuthService = googleAuthService;
        this.cookieUtil = cookieUtil;
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthenticationResponseDto>> loginWithGoogle(
            @RequestBody GoogleLoginRequestDto request) {

        AuthenticationResponseDto authResponse = googleAuthService.loginWithGoogle(request);

        ApiResponse<AuthenticationResponseDto> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "เข้าสู่ระบบด้วย Google สำเร็จ",
                authResponse
        );

        // set cookie เหมือน login ปกติเป๊ะ ๆ
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        cookieUtil.createAccessTokenCookie(authResponse.getAccessToken()).toString())
                .body(response);
    }
}