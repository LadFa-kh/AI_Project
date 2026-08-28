package com.example.backend.admin.controller;

import com.example.backend.admin.dto.AdminUserDto;
import com.example.backend.admin.dto.AdminUserUpdateDto;
import com.example.backend.admin.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDto> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminUserDto> updateUser(@PathVariable UUID id,
                                                   @RequestBody AdminUserUpdateDto request) {
        return ResponseEntity.ok(adminUserService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID id,
                                                          Authentication authentication) {
        // authentication.getName() คือ email ที่ JwtAuthenticationFilter ใส่ไว้ตอน validate token
        adminUserService.deleteUser(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "ลบผู้ใช้เรียบร้อยแล้ว"));
    }
}