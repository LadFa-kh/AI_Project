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
        TokenMeter meter = TokenMeter.start();
        try {
            T result = work.get();
            log(user, action, true, cost, System.currentTimeMillis() - t0, null, meter);
            return result;
        } catch (RuntimeException e) {
            log(user, action, false, 0, System.currentTimeMillis() - t0, e.getClass().getSimpleName() + ": " + e.getMessage(), meter);
            throw e;
        } finally {
            TokenMeter.clear();
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
        log(user, action, success, credits, ms, detail, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UserEntity user, String action, boolean success, int credits, long ms, String detail, TokenMeter meter) {
        UsageLogEntity l = new UsageLogEntity();
        l.setUser(user);
        l.setAction(action);
        l.setSuccess(success);
        l.setCreditsUsed(success ? credits : 0);
        l.setDurationMs(ms);
        l.setDetail(detail != null && detail.length() > 500 ? detail.substring(0, 500) : detail);
        l.setCreatedAt(Instant.now());
        if (meter != null) {
            l.setInputTokens(meter.totalInput());
            l.setOutputTokens(meter.totalOutput());
            l.setLlmModel(meter.model());
            try { l.setTokenBreakdown(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(meter.breakdown())); }
            catch (Exception ignored) { }
        }
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

    @Value("${app.llm.price.input-per-1m:0}")
    private double priceInputPer1M;

    @Value("${app.llm.price.output-per-1m:0}")
    private double priceOutputPer1M;

    @Value("${app.llm.price.currency:USD}")
    private String priceCurrency;

    /**
     * Cost per action: ค่าเฉลี่ย token ต่อ 1 ครั้งที่สำเร็จ แยกตาม action และตาม endpoint ของ Python
     * ราคาอ่านจาก app.llm.price.* (ตั้งตามหน้าราคาของผู้ให้บริการ) — ถ้ายังเป็น 0 ช่อง cost จะเป็น 0
     */
    @Transactional(readOnly = true)
    public Map<String, Object> costReport(LocalDate from, LocalDate to) {
        Instant f = (from == null ? LocalDate.now(TH).minusDays(30) : from).atStartOfDay(TH).toInstant();
        Instant t = (to == null ? LocalDate.now(TH) : to).plusDays(1).atStartOfDay(TH).toInstant();
        List<UsageLogEntity> logs = repository.findMetered(f, t);
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();

        Map<String, long[]> byAction = new TreeMap<>();      // [count, in, out]
        Map<String, long[]> byEndpoint = new TreeMap<>();    // [actions, in, out, calls]
        Map<String, String> models = new TreeMap<>();
        for (UsageLogEntity l : logs) {
            long[] a = byAction.computeIfAbsent(l.getAction(), k -> new long[3]);
            a[0]++; a[1] += nz(l.getInputTokens()); a[2] += nz(l.getOutputTokens());
            if (l.getLlmModel() != null) models.put(l.getAction(), l.getLlmModel());
            if (l.getTokenBreakdown() != null) {
                try {
                    Map<String, Map<String, Number>> bd = om.readValue(l.getTokenBreakdown(),
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Map<String, Number>>>() {});
                    bd.forEach((ep, v) -> {
                        long[] e = byEndpoint.computeIfAbsent(ep, k -> new long[4]);
                        e[0]++; e[1] += v.getOrDefault("input", 0).longValue();
                        e[2] += v.getOrDefault("output", 0).longValue(); e[3] += v.getOrDefault("calls", 0).longValue();
                    });
                } catch (Exception ignored) { }
            }
        }
        List<Map<String, Object>> actions = new ArrayList<>();
        byAction.forEach((k, a) -> actions.add(row(k, a[0], a[1], a[2], null, models.get(k))));
        List<Map<String, Object>> endpoints = new ArrayList<>();
        byEndpoint.forEach((k, e) -> endpoints.add(row(k, e[0], e[1], e[2], e[3], null)));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("from", f);
        out.put("to", t);
        out.put("pricePer1M", Map.of("input", priceInputPer1M, "output", priceOutputPer1M, "currency", priceCurrency));
        out.put("byAction", actions);
        out.put("byPythonEndpoint", endpoints);
        out.put("note", "ค่าเฉลี่ยต่อ 1 action ที่สำเร็จ; judge-skill-matches = ค่าใช้จ่ายของ semantic matching (B2)");
        return out;
    }

    private Map<String, Object> row(String name, long count, long in, long out, Long calls, String model) {
        Map<String, Object> m = new LinkedHashMap<>();
        double avgIn = count == 0 ? 0 : (double) in / count;
        double avgOut = count == 0 ? 0 : (double) out / count;
        m.put("name", name);
        m.put("samples", count);
        if (model != null) m.put("model", model);
        if (calls != null) m.put("avgLlmCalls", count == 0 ? 0 : Math.round((double) calls / count * 100) / 100.0);
        m.put("avgInputTokens", Math.round(avgIn));
        m.put("avgOutputTokens", Math.round(avgOut));
        m.put("avgCost", Math.round((avgIn * priceInputPer1M + avgOut * priceOutputPer1M) / 1_000_000 * 1_000_000) / 1_000_000.0);
        return m;
    }

    private static long nz(Long v) { return v == null ? 0 : v; }

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
