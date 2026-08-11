package com.example.backend.user.controller.login;

import com.example.backend.handle.ApiResponse;
import com.example.backend.user.dto.request.LoginRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.service.login.LoginService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticationResponseDto>> login(@RequestBody LoginRequestDto request) {
        // 1. เรียก Service ซึ่งจัดการเรื่องตรวจสอบรหัสผ่านและสร้าง Token ให้ทั้งหมดแล้ว
        AuthenticationResponseDto authResponse = loginService.login(request);

        // 2. ห่อหุ้มผลลัพธ์ด้วย ApiResponse เพื่อส่ง status และ message กลับไปให้ครบถ้วน
        ApiResponse<AuthenticationResponseDto> response = new ApiResponse<>(
                HttpStatus.OK.value(), // 200
                "เข้าสู่ระบบสำเร็จ",
                authResponse
        );

        return ResponseEntity.ok(response);
    }
}
