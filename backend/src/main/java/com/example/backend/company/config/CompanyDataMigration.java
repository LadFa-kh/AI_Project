package com.example.backend.company.config;

import com.example.backend.company.entity.CompanyEntity;
import com.example.backend.company.entity.JobDescriptionEntity;
import com.example.backend.company.entity.JobStatus;
import com.example.backend.company.repository.CompanyRepository;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * B3/B4: ย้ายข้อมูลเก่าอัตโนมัติตอนเริ่มระบบ (idempotent — รันซ้ำได้ ไม่สร้างซ้ำ)
 *  1) ประกาศที่ status เป็น null → OPEN (ข้อมูลเดิมยังมองเห็นเหมือนเดิม)
 *  2) ประกาศที่ยังไม่มี company → สร้าง/หา company จาก companyName แล้วผูก
 *  3) EMPLOYER ที่ยังไม่มี company และประกาศงานไว้ → ผูกกับบริษัทของประกาศล่าสุด
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CompanyDataMigration implements ApplicationRunner {

    private final JobDescriptionRepository jobRepo;
    private final CompanyRepository companyRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<JobDescriptionEntity> noStatus = jobRepo.findByStatusIsNull();
        noStatus.forEach(j -> j.setStatus(JobStatus.OPEN));
        jobRepo.saveAll(noStatus);

        Map<String, CompanyEntity> cache = new HashMap<>();
        List<JobDescriptionEntity> noCompany = jobRepo.findByCompanyIsNull();
        int linked = 0;
        for (JobDescriptionEntity j : noCompany) {
            String name = j.getCompanyName() == null ? "" : j.getCompanyName().trim();
            if (name.isEmpty()) continue;
            CompanyEntity c = cache.computeIfAbsent(name.toLowerCase(), k ->
                    companyRepo.findFirstByNameThIgnoreCase(name).orElseGet(() -> {
                        CompanyEntity n = new CompanyEntity();
                        n.setNameTh(name);
                        n.setStatus(CompanyEntity.Status.ACTIVE);
                        return companyRepo.save(n);
                    }));
            j.setCompany(c);
            linked++;
            UserEntity emp = j.getEmployer();
            if (emp != null && emp.getCompany() == null && emp.getRole() == UserEntity.Role.EMPLOYER) {
                emp.setCompany(c);
                userRepo.save(emp);
            }
        }
        jobRepo.saveAll(noCompany);
        if (!noStatus.isEmpty() || linked > 0) {
            log.info("[migration] set OPEN on {} jobs, linked {} jobs to companies ({} companies touched)",
                    noStatus.size(), linked, cache.size());
        }
    }
}
