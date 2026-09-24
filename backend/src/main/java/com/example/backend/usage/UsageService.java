package com.example.backend.usage;

import com.example.backend.handle.BusinessException;
import com.example.backend.handle.PageResponse;
import com.example.backend.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.function.Supplier;

/**
 * B8: เครดิตรายเดือน
 *   - โควตาต่อเดือนตั้งที่ app.credits.monthly-limit (0 = ไม่จำกัด)
 *   - ค่าใช้ต่อครั้งตั้งแยกตาม action: app.credits.cost.RESUME_UPLOAD / ASSESSMENT_SUBMIT
 *   - หักเครดิตเฉพาะตอนทำสำเร็จ ถ้าล้มเหลวบันทึก log แต่ credits_used = 0
 *   - เครดิตไม่พอ → 429 CREDITS_EXHAUSTED
 *   - ADMIN ไม่ถูกจำกัด (แต่ยังบันทึก log)
 *   - รอบเดือนนับตามเวลาไทย เริ่มวันที่ 1
 */
@Service
@RequiredArgsConstructor
public class UsageService {

    public static final String RESUME_UPLOAD = "RESUME_UPLOAD";
    public static final String ASSESSMENT_SUBMIT = "ASSESSMENT_SUBMIT";
    private static final ZoneId TH = ZoneId.of("Asia/Bangkok");

    private final UsageLogRepository repository;

    @Value("${app.credits.monthly-limit:30}")
    private int monthlyLimit;

    @Value("${app.credits.cost.RESUME_UPLOAD:1}")
    private int costResumeUpload;

    @Value("${app.credits.cost.ASSESSMENT_SUBMIT:1}")
    private int costAssessment;

    public int costOf(String action) {
        return switch (action) {
            case RESUME_UPLOAD -> costResumeUpload;
            case ASSESSMENT_SUBMIT -> costAssessment;
            default -> 0;
        };
    }

    /** ห่อการทำงาน: ตรวจเครดิต → ทำ → บันทึกผล (สำเร็จหักเครดิต / ล้มเหลวไม่หัก) */
    public <T> T run(UserEntity user, String action, Supplier<T> work) {
        int cost = costOf(action);
        requireCredits(user, cost);
        long t0 = System.currentTimeMillis();
        try {
            T result = work.get();
            log(user, action, true, cost, System.currentTimeMillis() - t0, null);
            return result;
        } catch (RuntimeException e) {
            log(user, action, false, 0, System.currentTimeMillis() - t0, e.getClass().getSimpleName() + ": " + e.getMessage());
            throw e;
        }
    }

    public void requireCredits(UserEntity user, int cost) {
        if (cost <= 0 || unlimited(user)) return;
        long used = usedThisMonth(user);
        if (used + cost > monthlyLimit) {
            throw BusinessException.tooManyRequests("CREDITS_EXHAUSTED",
                    "เครดิตเดือนนี้หมดแล้ว (ใช้ไป " + used + "/" + monthlyLimit + ") เครดิตจะรีเซ็ตวันที่ 1 ของเดือนถัดไป");
        }
    }

    /** REQUIRES_NEW: บันทึก log ได้แม้งานหลัก rollback */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UserEntity user, String action, boolean success, int credits, long ms, String detail) {
        UsageLogEntity l = new UsageLogEntity();
        l.setUser(user);
        l.setAction(action);
        l.setSuccess(success);
        l.setCreditsUsed(success ? credits : 0);
        l.setDurationMs(ms);
        l.setDetail(detail != null && detail.length() > 500 ? detail.substring(0, 500) : detail);
        l.setCreatedAt(Instant.now());
        repository.save(l);
    }

    public Map<String, Object> creditsOf(UserEntity user) {
        long used = usedThisMonth(user);
        Map<String, Object> m = new LinkedHashMap<>();
        boolean unl = unlimited(user);
        m.put("unlimited", unl);
        m.put("monthlyLimit", unl ? null : monthlyLimit);
        m.put("used", used);
        m.put("remaining", unl ? null : Math.max(0, monthlyLimit - used));
        m.put("resetAt", monthStart().plusMonths(1).toInstant());
        m.put("costs", Map.of(RESUME_UPLOAD, costResumeUpload, ASSESSMENT_SUBMIT, costAssessment));
        return m;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> search(UUID userId, String action, LocalDate from, LocalDate to, int page, int size) {
        Instant f = (from == null ? LocalDate.now(TH).minusDays(30) : from).atStartOfDay(TH).toInstant();
        Instant t = (to == null ? LocalDate.now(TH) : to).plusDays(1).atStartOfDay(TH).toInstant();
        var p = repository.search(userId, action == null || action.isBlank() ? null : action.toUpperCase(), f, t,
                PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 200)), Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.of(p.map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", l.getId());
            m.put("userId", l.getUser() == null ? null : l.getUser().getId());
            m.put("email", l.getUser() == null ? null : l.getUser().getEmail());
            m.put("action", l.getAction());
            m.put("success", l.isSuccess());
            m.put("creditsUsed", l.getCreditsUsed());
            m.put("durationMs", l.getDurationMs());
            m.put("detail", l.getDetail());
            m.put("createdAt", l.getCreatedAt());
            return m;
        }));
    }

    public List<Map<String, Object>> summary(LocalDate from, LocalDate to) {
        Instant f = (from == null ? LocalDate.now(TH).minusDays(30) : from).atStartOfDay(TH).toInstant();
        Instant t = (to == null ? LocalDate.now(TH) : to).plusDays(1).atStartOfDay(TH).toInstant();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : repository.summary(f, t)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("action", r[0]);
            m.put("total", r[1]);
            m.put("success", r[2]);
            m.put("creditsUsed", r[3]);
            out.add(m);
        }
        return out;
    }

    private boolean unlimited(UserEntity u) {
        return monthlyLimit <= 0 || u.getRole() == UserEntity.Role.ADMIN;
    }

    private long usedThisMonth(UserEntity user) {
        return repository.sumCreditsSince(user.getId(), monthStart().toInstant());
    }

    private ZonedDateTime monthStart() {
        return LocalDate.now(TH).withDayOfMonth(1).atStartOfDay(TH);
    }
}
