package com.example.backend.assessment.entity;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessment_answers")
public class AssessmentAnswerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // เชื่อมกับคำถามข้อไหน — ผ่าน question จะไล่ไปหา resume ได้ด้วย (question.resume)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private AssessmentQuestionEntity question;

    // เก็บ user ตรงไว้ด้วย แม้จะไล่ผ่าน question.resume.user ได้ก็ตาม
    // เหตุผล: ลด join ตอนเช็ค ownership (OwnershipGuard) ไม่ต้อง join ทะลุ 3 ชั้น
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // ค่าที่ผู้ใช้เลือก ต้องตรงกับ optionsA-D ใน AssessmentQuestionEntity เช่น "A","B","C","D"
    @Column(name = "selected_option", nullable = false)
    private String selectedOption;

    // คำนวณตอน submit โดยเทียบ selectedOption กับ question.correctAnswer แล้วเก็บผลไว้เลย
    // ไม่ต้องคำนวณซ้ำทุกครั้งที่ query ย้อนหลัง
    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    @Column(name = "answered_at")
    private Instant answeredAt;
}