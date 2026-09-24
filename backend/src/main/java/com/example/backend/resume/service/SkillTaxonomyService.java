package com.example.backend.resume.service;

import com.example.backend.resume.repository.SoftwareSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SkillTaxonomyService {

    private final SoftwareSkillRepository softwareSkillRepository;

    private static final Set<String> STOP_WORDS = Set.of(
            "and", "or", "for", "with", "the", "in", "of", "a", "an", "senior", "junior", "lead"
    );

    /** B10: cache ตามชื่อตำแหน่ง — ข้อมูล O*NET ไม่เปลี่ยนระหว่างรัน ไม่ต้อง query ซ้ำ (ผลเป็น read-only) */
    @org.springframework.cache.annotation.Cacheable(cacheNames = "standardSkills", key = "#desiredRoleName == null ? '' : #desiredRoleName.trim().toLowerCase()")
    public List<String> extractAndAggregateStandardSkills(String desiredRoleName) {
        if (desiredRoleName == null || desiredRoleName.isBlank()) {
            return Collections.emptyList();
        }

        String[] tokens = desiredRoleName.split("[,/\\-_&()\\s]+");
        Set<String> aggregatedSkillsSet = new HashSet<>();

        for (String token : tokens) {
            String cleanedToken = token.trim().toLowerCase();
            if (cleanedToken.length() >= 3 && !STOP_WORDS.contains(cleanedToken)) {
                List<String> skillsFromDb = softwareSkillRepository.findSkillNamesByTitleQuery(cleanedToken);
                if (skillsFromDb != null && !skillsFromDb.isEmpty()) {
                    aggregatedSkillsSet.addAll(skillsFromDb);
                }
            }
        }

        return List.copyOf(new java.util.TreeSet<>(aggregatedSkillsSet)); // เรียงคงที่ + แก้ไขไม่ได้ (ปลอดภัยต่อ cache)
    }

    public String normalize(String skillName) {
        return skillName
                .replaceAll("\\(.*?\\)", "")
                .replaceAll("[^a-zA-Z0-9\\s.#+]", "")
                .trim()
                .toLowerCase();
    }

    /**
     * [FIX] เปลี่ยนจาก substring matching แบบดิบ เป็น word-boundary matching
     * กันปัญหาคำสั้นๆ (เช่น "R", "Go", "C") ไปแมตช์มั่วกับคำอื่นที่บังเอิญมีตัวอักษรซ้อนกันอยู่ (เช่น "Docker" มี "r" อยู่ข้างใน)
     */
    private boolean isWordBoundaryMatch(String shorter, String longer) {
        if (shorter.isEmpty()) return false;
        String pattern = "\\b" + Pattern.quote(shorter) + "\\b";
        return Pattern.compile(pattern).matcher(longer).find();
    }

    /**
     * ตัวถ่วงคะแนนตามจำนวนทักษะที่จับคู่ได้
     *
     * เหตุผล: precisionScore เพียงอย่างเดียวทำให้เรซูเม่ที่มีทักษะน้อยมากได้คะแนนสูงเกินจริง
     * เช่น มีทักษะเดียวแล้วบังเอิญตรง จะได้ 100 เต็มทันที ตัวถ่วงนี้จึงลดคะแนนลงเมื่อ
     * จำนวนทักษะที่จับคู่ได้ยังน้อยเกินกว่าจะสรุปว่าผู้สมัครเหมาะกับตำแหน่งนั้นจริง
     */
    private static final double PENALTY_ONE_MATCH = 0.3;
    private static final double PENALTY_TWO_MATCHES = 0.6;
    private static final int PENALTY_FREE_THRESHOLD = 3;

    /**
     * คำนวณคะแนนเรซูเม่พร้อมคืนที่มาของคะแนนทุกขั้น
     *
     * ขั้นตอน
     *   1. จับคู่ทักษะจากเรซูเม่กับทักษะมาตรฐาน O*NET แบบ word boundary ทั้งสองทาง
     *   2. precisionScore = (จำนวนที่จับคู่ได้ / จำนวนทักษะทั้งหมดในเรซูเม่) x 100
     *      ตัวหารเป็นทักษะในเรซูเม่ ไม่ใช่ทักษะที่ตำแหน่งงานต้องการ ดังนั้นการใส่ทักษะ
     *      ที่ไม่เกี่ยวกับสายงานเข้ามาเยอะจะทำให้คะแนนลดลง
     *   3. คูณตัวถ่วงตามจำนวนที่จับคู่ได้ แล้วตัดไม่ให้เกิน 100
     */
    public SkillMatchResult calculateOnetSkillMatchDetail(List<String> extractedSkills, List<String> standardSkills) {
        int totalResume = extractedSkills == null ? 0 : extractedSkills.size();
        int totalStandard = standardSkills == null ? 0 : standardSkills.size();

        if (totalStandard == 0 || totalResume == 0) {
            // แยกสองสาเหตุออกจากกัน เพราะความหมายต่างกันมากสำหรับผู้ใช้
            // หาทักษะมาตรฐานไม่เจอ = ระบบเทียบให้ไม่ได้ ไม่ใช่ว่าผู้สมัครไม่มีทักษะ
            String why = totalStandard == 0
                    ? "ไม่พบทักษะมาตรฐานของตำแหน่งงานนี้ในฐานข้อมูล O*NET จึงยังเทียบทักษะให้ไม่ได้"
                    : "ไม่พบทักษะด้านเทคนิคในเรซูเม่ จึงไม่มีทักษะให้นำไปเทียบ";
            return SkillMatchResult.builder()
                    .resumeScore(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .matchedSkills(List.of())
                    .unmatchedSkills(extractedSkills == null ? List.of() : List.copyOf(extractedSkills))
                    .totalResumeSkills(totalResume)
                    .totalStandardSkills(totalStandard)
                    .precisionScore(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .penaltyFactor(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .reason(why)
                    .build();
        }

        List<String> matched = new ArrayList<>();
        List<String> unmatched = new ArrayList<>();

        for (String userSkill : extractedSkills) {
            String userLower = normalize(userSkill);
            if (userLower.length() < 2) {
                unmatched.add(userSkill);
                continue;
            }

            boolean hit = false;
            for (String stdSkill : standardSkills) {
                String stdLower = normalize(stdSkill);
                if (stdLower.length() < 2) continue;

                if (isWordBoundaryMatch(userLower, stdLower) || isWordBoundaryMatch(stdLower, userLower)) {
                    hit = true;
                    break;
                }
            }
            if (hit) {
                matched.add(userSkill);
            } else {
                unmatched.add(userSkill);
            }
        }

        int matchedCount = matched.size();
        double precision = ((double) matchedCount / totalResume) * 100.0;

        double penalty;
        if (matchedCount == 0) {
            penalty = 0.0;
        } else if (matchedCount == 1) {
            penalty = PENALTY_ONE_MATCH;
        } else if (matchedCount == 2) {
            penalty = PENALTY_TWO_MATCHES;
        } else {
            penalty = 1.0;
        }

        double score = Math.min(100.0, precision * penalty);

        String why;
        if (matchedCount == 0) {
            why = "ไม่มีทักษะในเรซูเม่ที่ตรงกับทักษะมาตรฐานของตำแหน่งงานนี้เลย";
        } else if (matchedCount < PENALTY_FREE_THRESHOLD) {
            why = "จับคู่ทักษะได้ " + matchedCount + " รายการ ซึ่งยังน้อยกว่า " + PENALTY_FREE_THRESHOLD
                    + " รายการ คะแนนจึงถูกคูณด้วยตัวถ่วง " + penalty + " เพื่อไม่ให้สูงเกินจริง";
        } else {
            why = "จับคู่ทักษะได้ " + matchedCount + " รายการ ตั้งแต่ " + PENALTY_FREE_THRESHOLD
                    + " รายการขึ้นไปไม่มีการคูณตัวถ่วง";
        }

        return SkillMatchResult.builder()
                .resumeScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP))
                .matchedSkills(matched)
                .unmatchedSkills(unmatched)
                .totalResumeSkills(totalResume)
                .totalStandardSkills(totalStandard)
                .precisionScore(BigDecimal.valueOf(precision).setScale(2, RoundingMode.HALF_UP))
                .penaltyFactor(BigDecimal.valueOf(penalty).setScale(2, RoundingMode.HALF_UP))
                .reason(why)
                .build();
    }

    /**
     * รูปแบบเดิมที่คืนเฉพาะตัวเลข เก็บไว้เพื่อไม่ให้โค้ดส่วนอื่นที่เรียกอยู่พัง
     * ภายในเรียก calculateOnetSkillMatchDetail ตัวเดียวกัน ผลลัพธ์จึงตรงกันเสมอ
     */
    public BigDecimal calculateOnetSkillMatchScore(List<String> extractedSkills, List<String> standardSkills) {
        return calculateOnetSkillMatchDetail(extractedSkills, standardSkills).getResumeScore();
    }

    // =====================================================================
    // B2: ตัวช่วยให้ SemanticSkillMatcher ใช้กติกาเดียวกันกับของเดิม
    // =====================================================================

    /** คืนทักษะมาตรฐานตัวแรกที่ตรงกับ userSkill ด้วยกติกา word boundary เดิม (ไม่เจอ = null) */
    public String findWordMatch(String userSkill, List<String> standardSkills) {
        String userLower = normalize(userSkill);
        if (userLower.length() < 2) return null;
        for (String stdSkill : standardSkills) {
            String stdLower = normalize(stdSkill);
            if (stdLower.length() < 2) continue;
            if (isWordBoundaryMatch(userLower, stdLower) || isWordBoundaryMatch(stdLower, userLower)) {
                return stdSkill;
            }
        }
        return null;
    }

    /** คำนวณคะแนนจากผลการจับคู่ที่ได้มาแล้ว — สูตร precision x penalty เดิมทุกประการ */
    public SkillMatchResult scoreFromMatches(List<String> extractedSkills, int totalStandard,
                                             List<String> matched, List<String> unmatched) {
        int totalResume = extractedSkills == null ? 0 : extractedSkills.size();
        if (totalStandard == 0 || totalResume == 0) {
            SkillMatchResult r = calculateOnetSkillMatchDetail(extractedSkills, totalStandard == 0 ? List.of() : List.of("_"));
            r.setTotalStandardSkills(totalStandard);
            return r;
        }
        int matchedCount = matched.size();
        double precision = ((double) matchedCount / totalResume) * 100.0;
        double penalty = matchedCount == 0 ? 0.0 : matchedCount == 1 ? PENALTY_ONE_MATCH
                : matchedCount == 2 ? PENALTY_TWO_MATCHES : 1.0;
        double score = Math.min(100.0, precision * penalty);
        String why;
        if (matchedCount == 0) {
            why = "ไม่มีทักษะในเรซูเม่ที่ตรงกับทักษะมาตรฐานของตำแหน่งงานนี้เลย";
        } else if (matchedCount < PENALTY_FREE_THRESHOLD) {
            why = "จับคู่ทักษะได้ " + matchedCount + " รายการ ซึ่งยังน้อยกว่า " + PENALTY_FREE_THRESHOLD
                    + " รายการ คะแนนจึงถูกคูณด้วยตัวถ่วง " + penalty + " เพื่อไม่ให้สูงเกินจริง";
        } else {
            why = "จับคู่ทักษะได้ " + matchedCount + " รายการ ตั้งแต่ " + PENALTY_FREE_THRESHOLD
                    + " รายการขึ้นไปไม่มีการคูณตัวถ่วง";
        }
        return SkillMatchResult.builder()
                .resumeScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP))
                .matchedSkills(matched)
                .unmatchedSkills(unmatched)
                .totalResumeSkills(totalResume)
                .totalStandardSkills(totalStandard)
                .precisionScore(BigDecimal.valueOf(precision).setScale(2, RoundingMode.HALF_UP))
                .penaltyFactor(BigDecimal.valueOf(penalty).setScale(2, RoundingMode.HALF_UP))
                .reason(why)
                .build();
    }

    /** B1: ทักษะยอดนิยมของตำแหน่ง (ใช้ token เดียวกับ extractAndAggregateStandardSkills) */
    @org.springframework.cache.annotation.Cacheable(cacheNames = "hotSkills", key = "#roleName == null ? '' : #roleName.trim().toLowerCase()")
    public List<String> hotSkillsForRole(String roleName) {
        if (roleName == null || roleName.isBlank()) return List.of();
        Set<String> out = new TreeSet<>();
        for (String token : roleName.split("[,/\\-_&()\\s]+")) {
            String t = token.trim().toLowerCase();
            if (t.length() >= 3 && !STOP_WORDS.contains(t)) {
                List<String> r = softwareSkillRepository.findHotSkillNamesByTitleQuery(t);
                if (r != null) out.addAll(r);
            }
        }
        return List.copyOf(out);
    }

    /** B1: ลำดับความนิยมของทักษะ (ตัวเลขน้อย = นิยมมาก) — ไม่อยู่ในรายการ = ท้ายสุด */
    @org.springframework.cache.annotation.Cacheable(cacheNames = "skillPopularity")
    public Map<String, Integer> skillPopularityRank() {
        List<String> ordered = softwareSkillRepository.findItHotSkillsByPopularity();
        Map<String, Integer> rank = new HashMap<>();
        for (int i = 0; i < ordered.size(); i++) rank.putIfAbsent(ordered.get(i), i);
        return Map.copyOf(rank);
    }
}
