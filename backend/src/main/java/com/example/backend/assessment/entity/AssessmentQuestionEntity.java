package com.example.backend.assessment.entity;

import com.example.backend.resume.entity.ResumeEntity;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "assessment_question")
public class AssessmentQuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // --- เชื่อม Foreign Key กับ ResumeEntity ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private ResumeEntity resume;

    @Column(name = "question_text")
    private String questionText;

    private String optionsA;
    private String optionsB;
    private String optionsC;
    private String optionsD;

    @Column(name = "correct_answer")
    private String correctAnswer;

    @Column(name = "target_skill")
    private String targetSkill;

}
