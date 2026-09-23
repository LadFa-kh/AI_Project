package com.example.backend.user.account;

import com.example.backend.config.CookieUtil;
import com.example.backend.config.CurrentUserProvider;
import com.example.backend.handle.ApiResponse;
import com.example.backend.usage.UsageService;
import com.example.backend.user.consent.ConsentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * /api/v1/users/me/**
 *   B8: GET  credits
 *   B9: GET/POST/DELETE consents, GET data-export, DELETE (ลบบัญชี)
 */
@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserAccountController {

    private final CurrentUserProvider currentUser;
    private final ConsentService consentService;
    private final UsageService usageService;
    private final AccountDataService accountDataService;
    private final CookieUtil cookieUtil;

    @GetMapping("/credits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> credits(Authentication auth) {
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", usageService.creditsOf(currentUser.getCurrentUser(auth))));
    }

    @GetMapping("/consents")
    public ResponseEntity<ApiResponse<Map<String, Object>>> consents(Authentication auth) {
        var u = currentUser.getCurrentUser(auth);
        return ResponseEntity.ok(new ApiResponse<>(200, "OK", Map.of(
                "currentVersion", consentService.currentVersion(),
                "needsConsent", consentService.needsConsent(u),
                "history", consentService.history(u))));
    }

    /** body: {"version":"1.0"} */
    @PostMapping("/consents")
    public ResponseEntity<ApiResponse<Map<String, Object>>> accept(Authentication auth, @RequestBody Map<String, String> body,
                                                                   HttpServletRequest http) {
        var u = currentUser.getCurrentUser(auth);
        consentService.accept(u, body.get("version"), http.getRemoteAddr(), http.getHeader("User-Agent"));
        return ResponseEntity.ok(new ApiResponse<>(200, "บันทึกการยอมรับนโยบายแล้ว",
                Map.of("needsConsent", false, "version", consentService.currentVersion())));
    }

    /** ถอนความยินยอม — ครั้งหน้าที่ login จะได้ needsConsent = true */
    @DeleteMapping("/consents")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> withdraw(Authentication auth) {
        var u = currentUser.getCurrentUser(auth);
        consentService.withdraw(u);
        return ResponseEntity.ok(new ApiResponse<>(200, "ถอนความยินยอมแล้ว", consentService.history(u)));
    }

    @GetMapping("/data-export")
    public ResponseEntity<Map<String, Object>> export(Authentication auth) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"my-data.json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(accountDataService.export(currentUser.getCurrentUser(auth)));
    }

    /** body: {"password":"..."} หรือบัญชี Google: {"confirm":"อีเมลตัวเอง"} */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteMe(Authentication auth, @RequestBody(required = false) Map<String, String> body) {
        var u = currentUser.getCurrentUser(auth);
        accountDataService.deleteAccount(u, body == null ? null : body.get("password"), body == null ? null : body.get("confirm"));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUtil.createLogoutCookie().toString())
                .body(new ApiResponse<>(200, "ลบบัญชีและข้อมูลของคุณเรียบร้อยแล้ว", null));
    }
}
