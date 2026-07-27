package com.example.backend.user.dto.request;

import com.example.backend.user.entity.UserEntity.Role;
import lombok.Data;

@Data
public class RegisterRequestDto {
    private String email;
    private String password;
    private String fullname;
    private String telephone;
    private Role role;

}