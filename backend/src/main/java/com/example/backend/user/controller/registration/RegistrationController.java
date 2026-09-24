package com.example.backend.user.controller.registration;

import com.example.backend.config.CookieUtil;
import com.example.backend.handle.ApiResponse;
import com.example.backend.user.dto.request.RegisterRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.service.registration.RegistrationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final CookieUtil cookieUtil;

    public RegistrationController(RegistrationService registrationService, CookieUtil cookieUtil) {
        this.registrationService = registrationService;
        this.cookieUtil = cookieUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthenticationResponseDto>> register(@Valid @RequestBody RegisterRequestDto request,
                                                                          jakarta.servlet.http.HttpServletRequest http) {
        AuthenticationResponseDto authResponse = registrationService.register(request,
                http.getRemoteAddr(), http.getHeader("User-Agent"));

        // B5: ผู้ประกาศงานที่รออนุมัติ — ไม่แนบ cookie
        if (authResponse.getAccessToken() == null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(
                    HttpStatus.CREATED.value(),
                    "สมัครสำเร็จ บัญชีผู้ประกาศงานกำลังรอผู้ดูแลระบบอนุมัติ",
                    authResponse, "EMPLOYER_PENDING"));
        }

        ApiResponse<AuthenticationResponseDto> response = new ApiResponse<>(
                HttpStatus.CREATED.value(),
                "ลงทะเบียนสำเร็จ",
                authResponse
        );

        // แนบ token ใส่ cookie แบบ HttpOnly เหมือนตอน login
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE,
                        cookieUtil.createAccessTokenCookie(authResponse.getAccessToken()).toString())
                .body(response);
    }
}