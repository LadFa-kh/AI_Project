package com.example.backend.assessment.entity;

import com.example.backend.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "assessment_answers")
public class AssessmentAnswerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // เชื่อมกับข้อสอบข้อไหน
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private AssessmentQuestionEntity question;

    // เชื่อมกับ User เพื่อลด Join ตอนเช็ค Ownership
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // ค่าคะแนนที่เลือก (เช่น 1, 2, 3, 4)
    @Column(name = "selected_score", nullable = false)
    private Integer selectedScore;

    @Column(name = "answered_at")
    private Instant answeredAt;
}