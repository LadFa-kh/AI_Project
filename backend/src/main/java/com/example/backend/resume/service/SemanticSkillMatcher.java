package com.example.backend.resume.service;

import com.example.backend.resume.entity.SkillMatchCacheEntity;
import com.example.backend.resume.repository.SkillMatchCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

/**
 * B2: จับคู่ทักษะแบบเข้าใจความหมาย
 *
 * ขั้นตอนต่อทักษะในเรซูเม่ 1 ตัว
 *   1. ลองจับคู่ด้วยคำแบบเดิมก่อน (word boundary) — เจอ = WORD จบ ไม่เสียเงิน LLM
 *   2. ไม่เจอ → retrieval: คัดทักษะมาตรฐานที่ "หน้าตาใกล้" ที่สุด TOP_K ตัว
 *      (ใช้ความคล้ายของตัวอักษรแบบ trigram + คำร่วม — ไม่มี embedding model ในระบบ
 *       และเพิ่ม library ใหม่ไม่ได้ จึงใช้วิธีนี้แทนอย่างตรงไปตรงมา)
 *   3. ดู cache (ตาราง skill_match_cache) ก่อน คู่ไหนยังไม่เคยตัดสิน → ส่งทีเดียวให้ LLM ตัดสิน
 *   4. บันทึกผลลง cache
 *   5. ถ้า Python/LLM ใช้ไม่ได้ → ถอยกลับไปใช้ผลของขั้นที่ 1 อย่างเดียว (WORD_FALLBACK) ระบบไม่ล่ม
 *
 * สูตรคะแนนยังเป็น precision x penalty เดิม เปลี่ยนแค่ "นับว่าตรง" ได้ฉลาดขึ้น
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SemanticSkillMatcher {

    private static final int TOP_K = 4; // ลดจาก 6 เพื่อให้คำขอเดียวจบเร็วพอ (Next.js proxy ตัดที่ 30 วินาที)
    private static final double MIN_RETRIEVAL_SIM = 0.0; // เอา TOP_K เสมอ — retrieval แบบตัวอักษรพลาดคู่ความหมายได้ง่าย เลยปล่อยให้ LLM เป็นคนกรอง
    private static final double MIN_CONFIDENCE = 0.8;
    private static final int MAX_PAIRS_PER_CALL = 60;
    private static final String JUDGE_PATH = "/api/v1/python/judge-skill-matches";

    private final SkillTaxonomyService taxonomy;
    private final SkillMatchCacheRepository cacheRepository;
    private final RestTemplate restTemplate = new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(30))
            .build();

    @Value("${fastapi.base.url:http://fastapi-ai:8000}")
    private String fastapiBaseUrl;

    @Value("${app.matching.semantic.enabled:true}")
    private boolean semanticEnabled;

    public SkillMatchResult match(List<String> resumeSkills, List<String> standardSkills) {
        return match(resumeSkills, standardSkills, true);
    }

    /**
     * @param allowLlm false = ใช้คำตรงกัน + ผลที่เคยตัดสินไว้ใน cache เท่านั้น ไม่เรียก LLM ใหม่ (เร็ว)
     *                 ใช้กับอาชีพรองใน careerMatches เพื่อไม่ให้คำขอเดียวเรียก LLM หลายรอบ
     */
    public SkillMatchResult match(List<String> resumeSkills, List<String> standardSkills, boolean allowLlm) {
        List<String> resume = resumeSkills == null ? List.of() : resumeSkills;
        List<String> standard = standardSkills == null ? List.of() : standardSkills;

        Map<String, SkillMatchDetail> details = new LinkedHashMap<>();
        List<String> needSemantic = new ArrayList<>();
        for (String rs : resume) {
            String hit = taxonomy.findWordMatch(rs, standard);
            if (hit != null) {
                details.put(rs, new SkillMatchDetail(rs, hit, "WORD", 1.0));
            } else {
                details.put(rs, new SkillMatchDetail(rs, null, "NONE", null));
                if (taxonomy.normalize(rs).length() >= 2) needSemantic.add(rs);
            }
        }

        String method = "WORD_ONLY";
        if (semanticEnabled && !needSemantic.isEmpty() && !standard.isEmpty()) {
            try {
                applySemantic(needSemantic, standard, details, allowLlm);
                method = allowLlm ? "SEMANTIC" : "SEMANTIC_CACHED";
            } catch (Exception e) {
                log.warn("[semantic-match] fallback to word match: {}", e.getMessage());
                method = "WORD_FALLBACK";
            }
        }

        List<String> matched = new ArrayList<>();
        List<String> unmatched = new ArrayList<>();
        LinkedHashSet<String> covered = new LinkedHashSet<>();
        for (SkillMatchDetail d : details.values()) {
            if (d.getStandardSkill() != null) {
                matched.add(d.getResumeSkill());
                covered.add(d.getStandardSkill());
            } else {
                unmatched.add(d.getResumeSkill());
            }
        }
        SkillMatchResult r = taxonomy.scoreFromMatches(resume, standard.size(), matched, unmatched);
        r.setMatchDetails(new ArrayList<>(details.values()));
        r.setCoveredStandardSkills(new ArrayList<>(covered));
        r.setMatchMethod(method);
        return r;
    }

    // ---------------------------------------------------------------------

    private void applySemantic(List<String> needSemantic, List<String> standard, Map<String, SkillMatchDetail> details,
                               boolean allowLlm) {
        // 1) retrieval: คู่ผู้สมัครของแต่ละทักษะ
        Map<String, List<String>> candidates = new LinkedHashMap<>();
        for (String rs : needSemantic) {
            String rk = taxonomy.normalize(rs);
            List<String> top = standard.stream()
                    .map(st -> Map.entry(st, similarity(rk, taxonomy.normalize(st))))
                    .filter(e -> e.getValue() >= MIN_RETRIEVAL_SIM)
                    .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                    .limit(TOP_K)
                    .map(Map.Entry::getKey)
                    .toList();
            if (!top.isEmpty()) candidates.put(rs, top);
        }
        if (candidates.isEmpty()) return;

        // 2) cache
        Set<String> resumeKeys = new HashSet<>();
        candidates.keySet().forEach(rs -> resumeKeys.add(key(rs)));
        Map<String, SkillMatchCacheEntity> cache = new HashMap<>();
        for (SkillMatchCacheEntity c : cacheRepository.findByResumeSkillKeyIn(resumeKeys)) {
            cache.put(c.getResumeSkillKey() + "||" + c.getStandardSkillKey(), c);
        }

        List<Map<String, String>> toJudge = new ArrayList<>();
        for (var e : candidates.entrySet()) {
            for (String st : e.getValue()) {
                if (!cache.containsKey(key(e.getKey()) + "||" + key(st))) {
                    toJudge.add(Map.of("resume_skill", e.getKey(), "standard_skill", st));
                }
            }
        }

        // 3) LLM ตัดสินคู่ที่ยังไม่เคยเห็น แล้วเก็บลง cache
        for (int i = 0; allowLlm && i < toJudge.size(); i += MAX_PAIRS_PER_CALL) {
            List<Map<String, String>> batch = toJudge.subList(i, Math.min(toJudge.size(), i + MAX_PAIRS_PER_CALL));
            JudgeResponse resp = restTemplate.postForObject(fastapiBaseUrl + JUDGE_PATH,
                    Map.of("pairs", batch), JudgeResponse.class);
            if (resp == null || resp.verdicts == null) throw new IllegalStateException("empty judge response");
            List<SkillMatchCacheEntity> toSave = new ArrayList<>();
            for (Verdict v : resp.verdicts) {
                if (v.resume_skill == null || v.standard_skill == null) continue;
                String ck = key(v.resume_skill) + "||" + key(v.standard_skill);
                if (cache.containsKey(ck)) continue;
                SkillMatchCacheEntity c = new SkillMatchCacheEntity();
                c.setResumeSkillKey(key(v.resume_skill));
                c.setStandardSkillKey(key(v.standard_skill));
                c.setMatch(v.is_match);
                c.setConfidence(v.confidence);
                cache.put(ck, c);
                toSave.add(c);
            }
            try {
                cacheRepository.saveAll(toSave);
            } catch (Exception ex) {
                // ชนกับ request อื่นที่บันทึกคู่เดียวกันพร้อมกัน — ไม่เป็นไร ผลยังใช้ได้
                log.debug("[semantic-match] cache save skipped: {}", ex.getMessage());
            }
        }

        // 4) เลือกคู่ที่ LLM บอกว่าตรงและมั่นใจสุด
        for (var e : candidates.entrySet()) {
            String best = null;
            double bestConf = -1;
            for (String st : e.getValue()) {
                SkillMatchCacheEntity c = cache.get(key(e.getKey()) + "||" + key(st));
                if (c == null || !c.isMatch()) continue;
                double conf = c.getConfidence() == null ? 0.7 : c.getConfidence();
                if (conf >= MIN_CONFIDENCE && conf > bestConf) { best = st; bestConf = conf; }
            }
            if (best != null) {
                details.put(e.getKey(), new SkillMatchDetail(e.getKey(), best, "SEMANTIC",
                        Math.round(bestConf * 100) / 100.0));
            }
        }
    }

    /** เปลี่ยนเลขนี้เมื่อแก้ prompt ตัดสิน — ผลเก่าใน cache จะถูกเมินอัตโนมัติ ไม่ต้องลบตาราง */
    private static final String CACHE_VERSION = "v2|";

    private String key(String s) {
        String k = CACHE_VERSION + taxonomy.normalize(s);
        return k.length() > 300 ? k.substring(0, 300) : k;
    }

    /** ความคล้าย = max(Jaccard ของ trigram ตัวอักษร, สัดส่วนคำที่ซ้ำกัน) */
    static double similarity(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        Set<String> ta = trigrams(a), tb = trigrams(b);
        Set<String> inter = new HashSet<>(ta);
        inter.retainAll(tb);
        Set<String> union = new HashSet<>(ta);
        union.addAll(tb);
        double jac = union.isEmpty() ? 0 : (double) inter.size() / union.size();

        Set<String> wa = new HashSet<>(Arrays.asList(a.split("\\s+")));
        Set<String> wb = new HashSet<>(Arrays.asList(b.split("\\s+")));
        Set<String> wi = new HashSet<>(wa);
        wi.retainAll(wb);
        double wordOverlap = (double) wi.size() / Math.max(1, Math.min(wa.size(), wb.size()));
        return Math.max(jac, wordOverlap);
    }

    private static Set<String> trigrams(String s) {
        String p = "  " + s + " ";
        Set<String> out = new HashSet<>();
        for (int i = 0; i + 3 <= p.length(); i++) out.add(p.substring(i, i + 3));
        return out;
    }

    // DTO สำหรับรับผลจาก Python (ชื่อฟิลด์ตรงกับ JSON)
    static class JudgeResponse { public List<Verdict> verdicts; }
    static class Verdict {
        public String resume_skill;
        public String standard_skill;
        public boolean is_match;
        public Double confidence;
    }
}
