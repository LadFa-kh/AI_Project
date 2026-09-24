package com.example.backend.user.service.registration;

import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.handle.BusinessException;
import com.example.backend.handle.jwt.JwtTokenProvider;
import com.example.backend.handle.repository.RefreshTokenRepository;
import com.example.backend.user.consent.ConsentService;
import com.example.backend.user.dto.request.RegisterRequestDto;
import com.example.backend.user.dto.response.AuthenticationResponseDto;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CompanyRepository companyRepository;
    private final ConsentService consentService;

    public RegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                               JwtTokenProvider jwtTokenProvider, RefreshTokenRepository refreshTokenRepository,
                               CompanyRepository companyRepository, ConsentService consentService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenRepository = refreshTokenRepository;
        this.companyRepository = companyRepository;
        this.consentService = consentService;
    }

    public AuthenticationResponseDto register(RegisterRequestDto request) {
        return register(request, null, null);
    }

    /**
     * STUDENT (ค่าเริ่มต้น) → ใช้งานได้ทันที ได้ token เหมือนเดิม
     * EMPLOYER → บัญชี PENDING ไม่ได้ token จนกว่า ADMIN จะอนุมัติ (B5)
     * ADMIN → ห้ามสมัครเอง 403 ROLE_NOT_ALLOWED
     */
    @Transactional
    public AuthenticationResponseDto register(RegisterRequestDto request, String ip, String userAgent) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw BusinessException.conflict("EMAIL_TAKEN", "อีเมลนี้ถูกใช้งานแล้ว");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw BusinessException.badRequest("PASSWORD_REQUIRED", "กรุณากรอกรหัสผ่าน");
        }
        String tel = normalizeTelephone(request.getTelephone());
        if (tel != null && userRepository.existsByTelephone(tel)) {
            throw BusinessException.conflict("TELEPHONE_TAKEN", "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว");
        }
        UserEntity.Role role = request.getRole() == null ? UserEntity.Role.STUDENT : request.getRole();
        if (role == UserEntity.Role.ADMIN) {
            throw BusinessException.forbidden("ROLE_NOT_ALLOWED", "ไม่สามารถสมัครเป็นผู้ดูแลระบบได้");
        }
        consentService.checkRegisterConsent(request.getAcceptedPolicyVersion());

        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullname());
        user.setTelephone(normalizeTelephone(request.getTelephone()));
        user.setRole(role);
        user.setCreatedAt(Instant.now());
        user.setAccountStatus(UserEntity.AccountStatus.ACTIVE);

        if (role == UserEntity.Role.EMPLOYER) {
            user.setAccountStatus(UserEntity.AccountStatus.PENDING);
            user.setCompany(resolveCompany(request));
        }

        UserEntity savedUser = userRepository.save(user);

        if (request.getAcceptedPolicyVersion() != null && !request.getAcceptedPolicyVersion().isBlank()
                && request.getAcceptedPolicyVersion().trim().equals(consentService.currentVersion())) {
            consentService.accept(savedUser, request.getAcceptedPolicyVersion(), ip, userAgent);
        }

        AuthenticationResponseDto dto;
        if (savedUser.effectiveStatus() == UserEntity.AccountStatus.ACTIVE) {
            dto = new AuthenticationResponseDto(savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(),
                    savedUser.getRole(), jwtTokenProvider.generateAccessToken(savedUser),
                    jwtTokenProvider.generateRefreshToken(savedUser));
        } else {
            // รออนุมัติ: ไม่ออก token
            dto = new AuthenticationResponseDto(savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(),
                    savedUser.getRole(), null, null);
        }
        dto.setAccountStatus(savedUser.effectiveStatus().name());
        dto.setNeedsConsent(consentService.needsConsent(savedUser));
        return dto;
    }

    private CompanyEntity resolveCompany(RegisterRequestDto r) {
        String name = r.getCompanyName() == null ? "" : r.getCompanyName().trim();
        String tax = r.getCompanyTaxId() == null || r.getCompanyTaxId().isBlank() ? null : r.getCompanyTaxId().trim();
        if (tax != null && !tax.matches("\\d{10,13}")) {
            throw BusinessException.badRequest("INVALID_TAX_ID", "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 10–13 หลัก");
        }
        if (name.isEmpty() && tax == null) {
            throw BusinessException.badRequest("COMPANY_REQUIRED", "ผู้ประกาศงานต้องระบุชื่อบริษัท (companyName)");
        }
        if (tax != null) {
            var byTax = companyRepository.findByTaxId(tax);
            if (byTax.isPresent()) return byTax.get();
        }
        if (!name.isEmpty()) {
            var byName = companyRepository.findFirstByNameThIgnoreCase(name);
            if (byName.isPresent()) return byName.get();
        }
        CompanyEntity c = new CompanyEntity();
        c.setNameTh(name.isEmpty() ? tax : name);
        c.setTaxId(tax);
        c.setStatus(CompanyEntity.Status.PENDING);
        return companyRepository.save(c);
    }

    private String normalizeTelephone(String telephone) {
        return (telephone == null || telephone.isBlank()) ? null : telephone.trim();
    }
}
