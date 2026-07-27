package com.example.backend.user.service.login;

import com.example.backend.user.dto.request.LoginRequestDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Inject UserRepository และ PasswordEncoder ผ่าน Constructor
    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserEntity login(LoginRequestDto request) {
        // 1. ค้นหา User ด้วย Email
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("อีเมลหรือรหัสผ่านไม่ถูกต้อง"));

        // 2. ตรวจสอบว่า Password ตรงกับ Hash ใน Database หรือไม่
        boolean isPasswordMatched = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!isPasswordMatched) {
            throw new IllegalArgumentException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }

        // 3. ถ้าถูกต้อง คืนค่า UserEntity ออกไป (หรือถ้าทำ JWT ค่อยสร้าง Token ส่งกลับตรงนี้)
        return user;
    }
}