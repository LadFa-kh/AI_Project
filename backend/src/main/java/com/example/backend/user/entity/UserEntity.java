package com.example.backend.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.AuthProvider;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    public enum Role {
        STUDENT,
        EMPLOYER,
        ADMIN
    }

    public enum AuthProvider {
        LOCAL, GOOGLE
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "full_name",nullable = false)
    private String fullName;

    @Column(unique = true)
    private String telephone;

    @Column(name = "password_hash", nullable = true)
    private String passwordHash;

    @Column(name = "created_at")
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider")
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "google_id")
    private String googleId;



    // B4: บริษัทที่ผู้ใช้สังกัด (เฉพาะ EMPLOYER)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private com.example.backend.company.entity.CompanyEntity company;

    // B5: สถานะบัญชี — null ถือว่า ACTIVE (บัญชีเก่าทั้งหมด)
    public enum AccountStatus { ACTIVE, PENDING, REJECTED, SUSPENDED }

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", length = 20)
    private AccountStatus accountStatus;

    @Column(name = "status_reason", columnDefinition = "TEXT")
    private String statusReason;

    public AccountStatus effectiveStatus() {
        return accountStatus == null ? AccountStatus.ACTIVE : accountStatus;
    }
}
