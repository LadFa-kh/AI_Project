package com.example.backend.user.controller.login;

import com.example.backend.config.CookieUtil;
import com.example.backend.handle.ApiResponse;
import com.example.backend.user.dto.request.LoginRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.service.login.LoginService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.backend.user.dto.response.CurrentUserDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/v1/auth")
public class LoginController {

    private final LoginService loginService;
    private final CookieUtil cookieUtil;
    private final UserRepository userRepository;

    public LoginController(LoginService loginService, CookieUtil cookieUtil, UserRepository userRepository) {
        this.loginService = loginService;
        this.cookieUtil = cookieUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticationResponseDto>> login(@RequestBody LoginRequestDto request) {
        AuthenticationResponseDto authResponse = loginService.login(request);

        ApiResponse<AuthenticationResponseDto> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "เข้าสู่ระบบสำเร็จ",
                authResponse
        );

        // แนบ token ใส่ cookie แบบ HttpOnly
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        cookieUtil.createAccessTokenCookie(authResponse.getAccessToken()).toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout() {
        ApiResponse<Object> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "ออกจากระบบเรียบร้อยแล้ว",
                null
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUtil.createLogoutCookie().toString())
                .body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserDto>> getCurrentUser(Authentication authentication) {

        // ไม่มี cookie หรือ token หมดอายุ → ยังไม่ได้ login
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(
                            HttpStatus.UNAUTHORIZED.value(),
                            "ยังไม่ได้เข้าสู่ระบบ",
                            null
                    ));
        }

        // authentication.getName() คือ email ที่ JwtAuthenticationFilter ใส่ไว้
        UserEntity user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(
                            HttpStatus.UNAUTHORIZED.value(),
                            "ไม่พบข้อมูลผู้ใช้",
                            null
                    ));
        }

        CurrentUserDto currentUser = CurrentUserDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL")
                .build();

        return ResponseEntity.ok(new ApiResponse<>(
                HttpStatus.OK.value(),
                "ดึงข้อมูลผู้ใช้สำเร็จ",
                currentUser
        ));
    }
}