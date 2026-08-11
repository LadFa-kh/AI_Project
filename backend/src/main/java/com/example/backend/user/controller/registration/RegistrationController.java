package com.example.backend.user.controller.registration;

import com.example.backend.handle.ApiResponse;
import com.example.backend.user.dto.request.RegisterRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.service.registration.RegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthenticationResponseDto>> register(@RequestBody RegisterRequestDto request) {
        // 1. เรียก Service ซึ่งจัดการบันทึกข้อมูลและสร้าง Token พร้อม DTO ให้เรียบร้อยแล้ว
        AuthenticationResponseDto authResponse = registrationService.register(request);

        // 2. ห่อหุ้มด้วย ApiResponse เพื่อส่ง status และ message มาตรฐานเดียวกันกับ Login
        ApiResponse<AuthenticationResponseDto> response = new ApiResponse<>(
                HttpStatus.CREATED.value(), // 201
                "ลงทะเบียนสำเร็จ",
                authResponse
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}