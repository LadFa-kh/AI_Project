package com.example.backend.user.dto.response;

import com.example.backend.user.entity.UserEntity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
public class AuthenticationResponseDto {
    private UUID userId;
    private String email;
    private String fullname;
    private Role role;
    private String accessToken;   // เพิ่ม Access Token
    private String refreshToken;  // เพิ่ม Refresh Token

    // ===== ฟิลด์ใหม่ (optional) =====
    /** B5: ACTIVE / PENDING */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String accountStatus;

    /** B9: true = ต้องให้ผู้ใช้กดยอมรับนโยบายเวอร์ชันปัจจุบันก่อนใช้งาน */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private Boolean needsConsent;

    public AuthenticationResponseDto(UUID userId, String email, String fullname, Role role,
                                     String accessToken, String refreshToken) {
        this.userId = userId;
        this.email = email;
        this.fullname = fullname;
        this.role = role;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
