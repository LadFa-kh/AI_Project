package com.example.backend.admin.service;

import com.example.backend.admin.dto.AdminUserDto;
import com.example.backend.admin.dto.AdminUserUpdateDto;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;

    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public AdminUserDto getUserById(UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบผู้ใช้ที่ระบุ"));
        return toDto(user);
    }

    @Transactional
    public AdminUserDto updateUser(UUID id, AdminUserUpdateDto request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบผู้ใช้ที่ระบุ"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getTelephone() != null) {
            user.setTelephone(request.getTelephone().isBlank() ? null : request.getTelephone().trim());
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                user.setRole(UserEntity.Role.valueOf(request.getRole().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException(
                        "role ต้องเป็น STUDENT, EMPLOYER หรือ ADMIN เท่านั้น แต่ได้รับ: " + request.getRole()
                );
            }
        }

        return toDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID id, String currentAdminEmail) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบผู้ใช้ที่ระบุ"));

        // กันไม่ให้ admin ลบตัวเอง — ป้องกันระบบไม่มี admin เหลือเลย
        if (user.getEmail().equals(currentAdminEmail)) {
            throw new IllegalStateException("ไม่สามารถลบบัญชีของตนเองได้");
        }

        // กันลบ user ที่มีข้อมูลผูกอยู่ (resume, คะแนน, คำตอบแบบประเมิน)
        // เพราะจะติด foreign key constraint แล้ว error งง ๆ
        long resumeCount = resumeRepository.findAll().stream()
                .filter(r -> r.getUserEntity().getId().equals(id))
                .count();

        if (resumeCount > 0) {
            throw new IllegalStateException(
                    "ไม่สามารถลบผู้ใช้นี้ได้ เนื่องจากมีเรซูเม่ผูกอยู่ " + resumeCount + " รายการ " +
                            "กรุณาลบข้อมูลที่เกี่ยวข้องก่อน"
            );
        }

        userRepository.delete(user);
    }

    private AdminUserDto toDto(UserEntity user) {
        long resumeCount = resumeRepository.findAll().stream()
                .filter(r -> r.getUserEntity() != null && r.getUserEntity().getId().equals(user.getId()))
                .count();

        return AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .telephone(user.getTelephone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .createdAt(user.getCreatedAt())
                .resumeCount(resumeCount)
                .build();
    }
}