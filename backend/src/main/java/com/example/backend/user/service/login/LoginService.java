package com.example.backend.user.service.login;

import com.example.backend.handle.jwt.JwtTokenProvider;
import com.example.backend.handle.repository.RefreshTokenRepository;
import com.example.backend.user.dto.request.LoginRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider; // คลาสสำหรับสร้าง JWT ของคุณ
    private final RefreshTokenRepository refreshTokenRepository;


    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider, RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public AuthenticationResponseDto login(LoginRequestDto request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("อีเมลหรือรหัสผ่านไม่ถูกต้อง"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }

        // สร้าง Access Token และ Refresh Token
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        // (ทางเลือก) บันทึก Refresh Token ลง Database
        // saveRefreshTokenToDatabase(user, refreshToken);

        return new AuthenticationResponseDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                accessToken,
                refreshToken
        );
    }
}