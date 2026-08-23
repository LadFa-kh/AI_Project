package com.example.backend.user.service.registration;

import com.example.backend.handle.jwt.JwtTokenProvider;
import com.example.backend.handle.repository.RefreshTokenRepository;
import com.example.backend.user.dto.request.RegisterRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    public RegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                               JwtTokenProvider jwtTokenProvider, RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public AuthenticationResponseDto register(RegisterRequestDto request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("อีเมลนี้ถูกใช้งานแล้ว");
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullname());
        user.setTelephone(normalizeTelephone(request.getTelephone()));
        user.setRole(UserEntity.Role.STUDENT);
        user.setCreatedAt(Instant.now());

        UserEntity savedUser = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(savedUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser);

        return new AuthenticationResponseDto(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole(),
                accessToken,
                refreshToken
        );
    }

    private String normalizeTelephone(String telephone) {
        return (telephone == null || telephone.isBlank()) ? null : telephone.trim();
    }
}


