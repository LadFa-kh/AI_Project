package com.example.backend.user.consent;

import com.example.backend.handle.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** B9: GET /api/v1/policies/current — สาธารณะ หน้าสมัครใช้แสดงเวอร์ชันนโยบาย */
@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final ConsentService consentService;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Map<String, Object>>> current() {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", consentService.currentPolicy()));
    }
}
