package com.example.backend.handle;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int status;       // เช่น 200, 400, 401
    private String message;
    private T data;

    /**
     * รหัสข้อผิดพลาดแบบตายตัว เช่น EMPLOYER_PENDING, CREDITS_EXHAUSTED
     * frontend ใช้ค่านี้เลือกข้อความภาษาไทยที่จะแสดง จึงไม่ต้องพึ่ง message
     * ซึ่งอาจเปลี่ยนถ้อยคำได้ ฟิลด์นี้เว้นว่าง (ไม่ถูกส่งออก) สำหรับคำตอบที่สำเร็จ
     */
    private String code;

    public ApiResponse(int status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(int status, String message, T data, String code) {
        this(status, message, data);
        this.code = code;
    }
}
