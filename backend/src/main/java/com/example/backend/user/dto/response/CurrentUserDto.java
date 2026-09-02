package com.example.backend.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CurrentUserDto {
    private UUID userId;
    private String email;
    private String fullName;
    private String role;
    private String authProvider;
}