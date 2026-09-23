package com.example.backend.company.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** B3: ทุกวันเวลา 00:05 (และทุกชั่วโมงเผื่อเซิร์ฟเวอร์ดับตอนเที่ยงคืน) เปิด/ปิดประกาศตามวันที่ */
@Slf4j
@Component
@RequiredArgsConstructor
public class JobStatusScheduler {

    private final JobDescriptionService jobDescriptionService;

    @Scheduled(cron = "${app.jobs.status-cron:0 5 * * * *}", zone = "Asia/Bangkok")
    public void sweep() {
        int[] r = jobDescriptionService.runStatusSweep();
        if (r[0] + r[1] > 0) log.info("[job-status] opened {}, closed {}", r[0], r[1]);
    }
}
