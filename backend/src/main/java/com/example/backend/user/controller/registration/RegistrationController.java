package com.example.backend.user.controller.registration;

import com.example.backend.user.dto.request.RegisterRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.service.registration.RegistrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // 👈 เปิดให้ Frontend (React/Vue) ยิง Cross-Origin เข้ามาได้ ไม่ติด CORS Error
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDto request) {

        try {
            UserEntity registeredUser = registrationService.register(request);

            AuthenticationResponseDto response = new AuthenticationResponseDto(
                    "ลงทะเบียนสำเร็จ",
                    registeredUser.getId(),
                    registeredUser.getEmail(),
                    registeredUser.getFullName(),
                    registeredUser.getRole()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}