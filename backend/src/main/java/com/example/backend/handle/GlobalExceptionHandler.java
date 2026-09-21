package com.example.backend.handle;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.stream.Collectors;

/**
 * ตัวจัดการข้อผิดพลาดจากส่วนกลาง
 *
 * ก่อนมีคลาสนี้ ข้อผิดพลาดที่เกิดจากการที่ผู้ใช้ส่งข้อมูลไม่ถูกต้องจะถูกตอบกลับ
 * ด้วยรหัสสถานะ 500 ทั้งหมด ซึ่งสื่อความหมายผิด เพราะ 500 หมายถึงเซิร์ฟเวอร์
 * ทำงานผิดพลาดเอง ไม่ใช่ผู้ใช้ส่งข้อมูลผิด และข้อความอธิบายภาษาไทยที่เขียนไว้
 * ใน Service ก็ไม่ถูกส่งถึงผู้ใช้
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** ข้อมูลที่ผู้ใช้ส่งมาไม่ถูกต้องตามเงื่อนไขทางธุรกิจ เช่น อีเมลซ้ำ ตอบแบบประเมินไม่ครบ */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), null));
    }

    /**
     * สถานะปัจจุบันของข้อมูลไม่อนุญาตให้ดำเนินการ เช่น ลบบัญชีของตนเอง
     * หรือลบผู้ใช้ที่ยังมีเรซูเม่ผูกอยู่
     *
     * ใช้รหัส 409 Conflict เนื่องจากคำขอถูกต้องตามรูปแบบทุกประการ
     * แต่ขัดแย้งกับสถานะของข้อมูลในระบบ ต่างจาก 400 ที่หมายถึงรูปแบบคำขอไม่ถูกต้อง
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(HttpStatus.CONFLICT.value(), ex.getMessage(), null));
    }

    /** ข้อมูลไม่ผ่านการตรวจสอบด้วย Bean Validation เช่น @Email หรือ @NotBlank */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(" "));
        if (message.isBlank()) {
            message = "ข้อมูลที่ส่งมาไม่ถูกต้อง";
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), message, null));
    }

    /** ไฟล์ที่อัปโหลดมีขนาดเกินค่าที่กำหนดไว้ */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleFileTooLarge(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiResponse<>(HttpStatus.PAYLOAD_TOO_LARGE.value(),
                        "ไฟล์มีขนาดเกิน 5 เมกะไบต์ กรุณาลดขนาดไฟล์แล้วอัปโหลดใหม่", null));
    }

    /**
     * ส่งต่อข้อผิดพลาดด้านสิทธิ์ให้ Spring Security จัดการตามเดิม
     * หากดักไว้ที่นี่ การปฏิเสธสิทธิ์ที่ควรเป็น 403 จะกลายเป็น 500
     */
    @ExceptionHandler(AccessDeniedException.class)
    public void handleAccessDenied(AccessDeniedException ex) throws AccessDeniedException {
        throw ex;
    }

    /**
     * ข้อผิดพลาดที่ไม่ได้คาดคิด บันทึกรายละเอียดไว้ในบันทึกของเซิร์ฟเวอร์
     * แต่ไม่ส่งรายละเอียดกลับไปให้ผู้ใช้ เนื่องจากข้อความภายในอาจเปิดเผย
     * โครงสร้างฐานข้อมูลหรือเส้นทางไฟล์ ซึ่งเป็นช่องทางให้ผู้ไม่หวังดีใช้ประโยชน์
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnexpected(Exception ex) {
        log.error("เกิดข้อผิดพลาดที่ไม่ได้คาดคิด", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", null));
    }
}
