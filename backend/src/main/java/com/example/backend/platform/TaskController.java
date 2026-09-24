package com.example.backend.platform;

import com.example.backend.config.CurrentUserProvider;
import com.example.backend.handle.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** B10: GET /api/v1/tasks/{taskId} — ดูสถานะงานเบื้องหลัง (เจ้าของงานหรือ ADMIN เท่านั้น) */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final AsyncTaskService taskService;
    private final CurrentUserProvider currentUser;

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status(Authentication auth, @PathVariable UUID taskId) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", taskService.status(taskId, currentUser.getCurrentUser(auth))));
    }
}
