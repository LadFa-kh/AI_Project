package com.example.backend.usage;

import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Cost per action: รวม token ที่ Python/LLM ใช้ใน 1 action (อัปโหลดเรซูเม่ / ส่งแบบประเมิน)
 *
 * Python ส่งตัวเลขกลับมาใน header X-LLM-Input-Tokens / X-LLM-Output-Tokens / X-LLM-Calls / X-LLM-Model
 * interceptor ของ RestTemplate อ่าน header แล้วบวกเข้า meter ของ action ที่กำลังทำงานอยู่ (ThreadLocal)
 * แยกยอดตาม endpoint ของ Python ด้วย เช่น judge-skill-matches = ค่าใช้จ่ายของ B2
 */
public final class TokenMeter {

    public static final class Counter {
        public final AtomicLong input = new AtomicLong();
        public final AtomicLong output = new AtomicLong();
        public final AtomicLong calls = new AtomicLong();
    }

    private final Map<String, Counter> byEndpoint = new ConcurrentHashMap<>();
    private volatile String model;

    private static final ThreadLocal<TokenMeter> CURRENT = new ThreadLocal<>();

    public static TokenMeter start() { TokenMeter m = new TokenMeter(); CURRENT.set(m); return m; }
    public static TokenMeter current() { return CURRENT.get(); }
    public static void bind(TokenMeter m) { if (m == null) CURRENT.remove(); else CURRENT.set(m); }
    public static void clear() { CURRENT.remove(); }

    public long totalInput() { return byEndpoint.values().stream().mapToLong(c -> c.input.get()).sum(); }
    public long totalOutput() { return byEndpoint.values().stream().mapToLong(c -> c.output.get()).sum(); }
    public String model() { return model; }

    public Map<String, Map<String, Long>> breakdown() {
        Map<String, Map<String, Long>> out = new LinkedHashMap<>();
        byEndpoint.forEach((k, c) -> out.put(k, Map.of("input", c.input.get(), "output", c.output.get(), "calls", c.calls.get())));
        return out;
    }

    void add(String endpoint, long in, long out, long calls, String model) {
        Counter c = byEndpoint.computeIfAbsent(endpoint, k -> new Counter());
        c.input.addAndGet(in);
        c.output.addAndGet(out);
        c.calls.addAndGet(calls);
        if (model != null && !model.isBlank()) this.model = model;
    }

    /** ใส่ตัวนับให้ RestTemplate — ใช้ครอบตอนสร้าง: TokenMeter.instrument(new RestTemplate()) */
    public static RestTemplate instrument(RestTemplate rt) {
        ClientHttpRequestInterceptor it = (req, body, exec) -> {
            var resp = exec.execute(req, body);
            TokenMeter m = CURRENT.get();
            if (m != null) {
                var h = resp.getHeaders();
                String path = req.getURI().getPath();
                String ep = path.substring(path.lastIndexOf('/') + 1);
                m.add(ep, num(h.getFirst("X-LLM-Input-Tokens")), num(h.getFirst("X-LLM-Output-Tokens")),
                        num(h.getFirst("X-LLM-Calls")), h.getFirst("X-LLM-Model"));
            }
            return resp;
        };
        rt.getInterceptors().add(it);
        return rt;
    }

    private static long num(String s) {
        try { return s == null ? 0 : Long.parseLong(s.trim()); } catch (Exception e) { return 0; }
    }
}
