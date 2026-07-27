package com.example.backend.user.service.registration;

import com.example.backend.user.dto.request.RegisterRequestDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructor Injection (Spring จะยัด Dependency เข้ามาให้อัตโนมัติ)
    public RegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserEntity register(RegisterRequestDto request) {
        // 1. ตรวจสอบว่า Email ซ้ำหรือไม่
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email นี้ถูกลงทะเบียนไปแล้ว");
        }

        // 2. ตรวจสอบว่า เบอร์โทรศัพท์ ซ้ำหรือไม่ (ถ้ามีการส่งมา)
        if (request.getTelephone() != null && !request.getTelephone().isEmpty()) {
            if (userRepository.existsByTelephone(request.getTelephone())) {
                throw new IllegalArgumentException("เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว");
            }
        }

        // 3. แปลง Password ให้เป็น Hash ด้วย BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 4. สร้าง Entity ใหม่ขึ้นมา
        UserEntity newUser = new UserEntity();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(hashedPassword);
        newUser.setFullName(request.getFullname());
        newUser.setTelephone(request.getTelephone());
        newUser.setRole(request.getRole());
        newUser.setCreatedAt(Instant.now()); // บันทึกเวลาปัจจุบัน

        // 5. Save ลง Database
        return userRepository.save(newUser);
    }

}
