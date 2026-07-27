package com.example.backend.user.dto.response;

import com.example.backend.user.entity.UserEntity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

@Data
@AllArgsConstructor

public class AuthenticationResponseDto {
    private String message;
    private UUID userId;
    private String email;
    private String fullname;
    private Role role;
}