package com.example.backend.user.dto.request;

import com.example.backend.user.entity.UserEntity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequestDto {

    @Email(message = "รูปแบบอีเมลไม่ถูกต้อง")
    @NotBlank(message = "กรุณากรอกอีเมล")
    private String email;

    private String password;
    private String fullname;
    private String telephone;
    private Role role;


    // ===== B5: ใช้เมื่อ role = EMPLOYER =====
    private String companyName;
    private String companyTaxId;

    // ===== B9: เวอร์ชันนโยบายความเป็นส่วนตัวที่ผู้ใช้กดยอมรับ =====
    private String acceptedPolicyVersion;
}
