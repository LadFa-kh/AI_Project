package com.example.backend.user.consent;

import com.example.backend.handle.BusinessException;
import com.example.backend.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * B9: นโยบายความเป็นส่วนตัว
 * เวอร์ชันปัจจุบันตั้งใน application.properties (app.policy.version) — เปลี่ยนเลขเมื่อแก้นโยบาย
 * ผู้ใช้ทุกคนจะได้ needsConsent=true ตอน login จนกว่าจะกดยอมรับเวอร์ชันใหม่
 */
@Service
@RequiredArgsConstructor
public class ConsentService {

    public static final String PRIVACY = "PRIVACY_POLICY";

    private final UserConsentRepository repository;

    @Value("${app.policy.version:1.0}")
    private String currentVersion;

    @Value("${app.policy.url:/privacy-policy}")
    private String policyUrl;

    @Value("${app.policy.effective-date:2026-09-24}")
    private String effectiveDate;

    /** true = ห้ามสมัครถ้าไม่ส่ง acceptedPolicyVersion ที่ตรงเวอร์ชันปัจจุบัน */
    @Value("${app.policy.enforce-on-register:false}")
    private boolean enforceOnRegister;

    public String currentVersion() { return currentVersion; }

    public Map<String, Object> currentPolicy() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("policyType", PRIVACY);
        m.put("version", currentVersion);
        m.put("url", policyUrl);
        m.put("effectiveDate", effectiveDate);
        m.put("requiredOnRegister", enforceOnRegister);
        return m;
    }

    /** ตรวจตอนสมัคร: enforce=true และไม่ยอมรับ → 400 CONSENT_REQUIRED */
    public void checkRegisterConsent(String acceptedVersion) {
        if (!enforceOnRegister) return;
        if (acceptedVersion == null || !acceptedVersion.trim().equals(currentVersion)) {
            throw BusinessException.badRequest("CONSENT_REQUIRED",
                    "กรุณายอมรับนโยบายความเป็นส่วนตัวเวอร์ชัน " + currentVersion + " ก่อนสมัครสมาชิก");
        }
    }

    public boolean needsConsent(UserEntity user) {
        return !repository.existsByUser_IdAndPolicyTypeAndPolicyVersionAndWithdrawnAtIsNull(user.getId(), PRIVACY, currentVersion);
    }

    @Transactional
    public UserConsentEntity accept(UserEntity user, String version, String ip, String userAgent) {
        if (version == null || !version.trim().equals(currentVersion)) {
            throw BusinessException.badRequest("POLICY_VERSION_MISMATCH",
                    "เวอร์ชันนโยบายไม่ตรงกับเวอร์ชันปัจจุบัน (" + currentVersion + ")");
        }
        if (!needsConsent(user)) {
            return repository.findByUser_IdOrderByAcceptedAtDesc(user.getId()).get(0);
        }
        UserConsentEntity c = new UserConsentEntity();
        c.setUser(user);
        c.setPolicyType(PRIVACY);
        c.setPolicyVersion(currentVersion);
        c.setAcceptedAt(Instant.now());
        c.setIpAddress(ip);
        c.setUserAgent(userAgent != null && userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent);
        return repository.save(c);
    }

    @Transactional
    public void withdraw(UserEntity user) {
        repository.findByUser_IdOrderByAcceptedAtDesc(user.getId()).stream()
                .filter(c -> c.getWithdrawnAt() == null)
                .forEach(c -> { c.setWithdrawnAt(Instant.now()); repository.save(c); });
    }

    public List<Map<String, Object>> history(UserEntity user) {
        return repository.findByUser_IdOrderByAcceptedAtDesc(user.getId()).stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("policyType", c.getPolicyType());
            m.put("version", c.getPolicyVersion());
            m.put("acceptedAt", c.getAcceptedAt());
            m.put("withdrawnAt", c.getWithdrawnAt());
            return m;
        }).toList();
    }
}
