package com.example.backend.platform;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * B10: จำกัดจำนวนคำขอต่อ IP แบบหน้าต่างเวลา 1 นาที (in-memory — พอสำหรับเซิร์ฟเวอร์เครื่องเดียว
 * ถ้าขยายเป็นหลายเครื่องต้องย้ายตัวนับไป Redis)
 *
 *   กลุ่ม AUTH  : /auth/login, /auth/register, /auth/google        ค่าเริ่มต้น 10 ครั้ง/นาที
 *   กลุ่ม AI    : /resumes/upload, /assessments/submit             ค่าเริ่มต้น 6 ครั้ง/นาที
 *   กลุ่ม ADMIN_IMPORT : /admin/companies/import                    ค่าเริ่มต้น 5 ครั้ง/นาที
 *   เกิน → 429 {"status":429,"code":"RATE_LIMITED","message":...} + header Retry-After
 *
 * IP จริงอ่านจาก CF-Connecting-IP (Cloudflare Tunnel) → X-Forwarded-For → remoteAddr
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.ratelimit.enabled:true}")
    private boolean enabled;
    @Value("${app.ratelimit.auth-per-minute:10}")
    private int authLimit;
    @Value("${app.ratelimit.ai-per-minute:6}")
    private int aiLimit;
    @Value("${app.ratelimit.import-per-minute:5}")
    private int importLimit;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private volatile long lastCleanup = System.currentTimeMillis();

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger();
        Window(long start) { this.start = start; }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (!enabled || "OPTIONS".equalsIgnoreCase(req.getMethod()) || !"POST".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }
        String path = req.getRequestURI();
        String group;
        int limit;
        if (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/register") || path.startsWith("/api/v1/auth/google")) {
            group = "AUTH"; limit = authLimit;
        } else if (path.startsWith("/api/v1/resumes/upload") || path.startsWith("/api/v1/assessments/submit")) {
            group = "AI"; limit = aiLimit;
        } else if (path.startsWith("/api/v1/admin/companies/import")) {
            group = "IMPORT"; limit = importLimit;
        } else {
            chain.doFilter(req, res);
            return;
        }

        long now = System.currentTimeMillis();
        long minute = now / 60_000;
        String key = group + "|" + clientIp(req) + "|" + minute;
        Window w = windows.computeIfAbsent(key, k -> new Window(minute * 60_000));
        int n = w.count.incrementAndGet();
        cleanup(now);

        if (n > limit) {
            long retry = Math.max(1, (w.start + 60_000 - now) / 1000);
            res.setStatus(429);
            res.setHeader("Retry-After", String.valueOf(retry));
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"status\":429,\"code\":\"RATE_LIMITED\",\"message\":\"ส่งคำขอถี่เกินไป กรุณารอ "
                    + retry + " วินาทีแล้วลองใหม่\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private void cleanup(long now) {
        if (now - lastCleanup < 120_000) return;
        lastCleanup = now;
        windows.entrySet().removeIf(e -> now - e.getValue().start > 120_000);
    }

    static String clientIp(HttpServletRequest req) {
        String cf = req.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) return cf.trim();
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
