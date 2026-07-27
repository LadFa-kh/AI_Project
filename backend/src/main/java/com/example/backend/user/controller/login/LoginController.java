package com.example.backend.user.controller.login;

import com.example.backend.user.dto.request.LoginRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.service.login.LoginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // 👈 กันติด CORS
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request) {
        try {
            UserEntity user = loginService.login(request);

            AuthenticationResponseDto response = new AuthenticationResponseDto(
                    "เข้าสู่ระบบสำเร็จ",
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole()
            );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
