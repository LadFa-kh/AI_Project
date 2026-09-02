package com.example.backend.user.dto.response;

import com.example.backend.user.entity.UserEntity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponseDto {
    private UUID userId;
    private String email;
    private String fullname;
    private Role role;
    private String accessToken;   // เพิ่ม Access Token
    private String refreshToken;  // เพิ่ม Refresh Token
}