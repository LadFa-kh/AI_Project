package com.example.backend.handle;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * ข้อผิดพลาดทางธุรกิจที่ต้องการส่ง "code" คงที่ให้ frontend
 * รูปแบบคำตอบ: { "status": 403, "code": "EMPLOYER_PENDING", "message": "..." }
 */
@Getter
public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public BusinessException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static BusinessException badRequest(String code, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, code, message);
    }

    public static BusinessException notFound(String code, String message) {
        return new BusinessException(HttpStatus.NOT_FOUND, code, message);
    }

    public static BusinessException forbidden(String code, String message) {
        return new BusinessException(HttpStatus.FORBIDDEN, code, message);
    }

    public static BusinessException conflict(String code, String message) {
        return new BusinessException(HttpStatus.CONFLICT, code, message);
    }

    public static BusinessException tooManyRequests(String code, String message) {
        return new BusinessException(HttpStatus.TOO_MANY_REQUESTS, code, message);
    }

    public static BusinessException unauthorized(String code, String message) {
        return new BusinessException(HttpStatus.UNAUTHORIZED, code, message);
    }
}
