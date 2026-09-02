package com.example.backend.admin.dto;

import lombok.Data;

@Data
public class AdminUserUpdateDto {
    private String fullName;
    private String telephone;
    private String role;   // STUDENT / EMPLOYER / ADMIN
}