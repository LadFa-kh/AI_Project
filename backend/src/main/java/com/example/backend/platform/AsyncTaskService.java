package com.example.backend.platform;

import com.example.backend.handle.BusinessException;
import com.example.backend.user.entity.UserEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.function.Supplier;

/**
 * B10: งานเบื้องหลังสำหรับคำขอที่ใช้เวลานาน (เรียก AI) — ส่งงานแล้วได้ taskId กลับทันที (202)
 * แล้วหน้าบ้านเรียก GET /api/v1/tasks/{taskId} ทุก 2–3 วินาทีจนกว่า status = DONE / FAILED
 *
 * เก็บสถานะในหน่วยความจำ (หายเมื่อรีสตาร์ต) และเก็บผลไว้ 1 ชั่วโมง — พอสำหรับเครื่องเดียว
 */
@Slf4j
@Service
public class AsyncTaskService {

    public enum State { PENDING, RUNNING, DONE, FAILED }

    public static final class Task {
        final UUID id = UUID.randomUUID();
        final UUID ownerId;
        final boolean ownerAdmin;
        final String type;
        final Instant createdAt = Instant.now();
        volatile State state = State.PENDING;
        volatile Instant finishedAt;
        volatile Object result;
        volatile String errorCode;
        volatile String errorMessage;
        Task(UUID ownerId, boolean ownerAdmin, String type) { this.ownerId = ownerId; this.ownerAdmin = ownerAdmin; this.type = type; }
    }

    private static final Duration KEEP = Duration.ofHours(1);
    private final Map<UUID, Task> tasks = new ConcurrentHashMap<>();
    private final ExecutorService pool = Executors.newFixedThreadPool(4, r -> {
        Thread t = new Thread(r, "async-task");
        t.setDaemon(true);
        return t;
    });

    public UUID submit(UserEntity owner, String type, Supplier<Object> work) {
        purge();
        Task t = new Task(owner.getId(), owner.getRole() == UserEntity.Role.ADMIN, type);
        tasks.put(t.id, t);
        pool.submit(() -> {
            t.state = State.RUNNING;
            try {
                t.result = work.get();
                t.state = State.DONE;
            } catch (BusinessException e) {
                t.errorCode = e.getCode();
                t.errorMessage = e.getMessage();
                t.state = State.FAILED;
            } catch (Exception e) {
                log.warn("[task] {} failed: {}", t.id, e.getMessage());
                t.errorCode = e instanceof IllegalArgumentException ? "BAD_REQUEST"
                        : e instanceof IllegalStateException ? "CONFLICT" : "INTERNAL_ERROR";
                t.errorMessage = e.getMessage();
                t.state = State.FAILED;
            } finally {
                t.finishedAt = Instant.now();
            }
        });
        return t.id;
    }

    public Map<String, Object> status(UUID id, UserEntity viewer) {
        Task t = tasks.get(id);
        if (t == null) throw BusinessException.notFound("TASK_NOT_FOUND", "ไม่พบงาน หรือหมดอายุแล้ว");
        if (!t.ownerId.equals(viewer.getId()) && viewer.getRole() != UserEntity.Role.ADMIN) {
            throw BusinessException.notFound("TASK_NOT_FOUND", "ไม่พบงาน หรือหมดอายุแล้ว");
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("taskId", t.id);
        m.put("type", t.type);
        m.put("status", t.state.name());
        m.put("createdAt", t.createdAt);
        m.put("finishedAt", t.finishedAt);
        if (t.state == State.DONE) m.put("result", t.result);
        if (t.state == State.FAILED) { m.put("errorCode", t.errorCode); m.put("errorMessage", t.errorMessage); }
        return m;
    }

    private void purge() {
        Instant cut = Instant.now().minus(KEEP);
        tasks.values().removeIf(t -> t.finishedAt != null && t.finishedAt.isBefore(cut));
    }
}
