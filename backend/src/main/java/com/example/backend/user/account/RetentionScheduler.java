package com.example.backend.user.account;

import com.example.backend.usage.UsageLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * B9: ระยะเวลาเก็บข้อมูล (retention) — รันทุกวันตี 3 เวลาไทย
 *   app.retention.usage-log-days (ค่าเริ่มต้น 365, 0 = ไม่ลบ)
 * ข้อมูลเรซูเม่ไม่ลบอัตโนมัติ: ผู้ใช้ลบเองผ่าน DELETE /users/me (เขียนไว้ในนโยบายความเป็นส่วนตัว)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RetentionScheduler {

    private final UsageLogRepository usageLogRepository;

    @Value("${app.retention.usage-log-days:365}")
    private int usageLogDays;

    @Scheduled(cron = "${app.retention.cron:0 0 3 * * *}", zone = "Asia/Bangkok")
    @Transactional
    public void purge() {
        if (usageLogDays <= 0) return;
        int n = usageLogRepository.deleteOlderThan(Instant.now().minus(Duration.ofDays(usageLogDays)));
        if (n > 0) log.info("[retention] deleted {} usage logs older than {} days", n, usageLogDays);
    }
}
