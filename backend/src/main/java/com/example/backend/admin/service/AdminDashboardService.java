package com.example.backend.admin.service;

import com.example.backend.admin.dto.AdminDashboardDto;
import com.example.backend.assessment.repository.AssessmentScoreRepository;
import com.example.backend.company.repository.JobDescriptionRepository;
import com.example.backend.finalscore.entity.FinalScoreEntity;
import com.example.backend.finalscore.repository.FinalScoreRepository;
import com.example.backend.resume.repository.ResumeRepository;
import com.example.backend.user.entity.UserEntity;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final AssessmentScoreRepository assessmentScoreRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final FinalScoreRepository finalScoreRepository;

    public AdminDashboardDto getDashboardSummary() {
        List<UserEntity> allUsers = userRepository.findAll();

        long totalStudents = allUsers.stream()
                .filter(u -> u.getRole() == UserEntity.Role.STUDENT)
                .count();
        long totalAdmins = allUsers.stream()
                .filter(u -> u.getRole() == UserEntity.Role.ADMIN)
                .count();

        List<FinalScoreEntity> allFinalScores = finalScoreRepository.findAll();

        return AdminDashboardDto.builder()
                .totalUsers(allUsers.size())
                .totalStudents(totalStudents)
                .totalAdmins(totalAdmins)
                .totalResumes(resumeRepository.count())
                .totalAssessmentsCompleted(assessmentScoreRepository.count())
                .totalJobPostings(jobDescriptionRepository.count())
                .averageResumeScore(average(allFinalScores, FinalScoreEntity::getResumeScore))
                .averageAssessmentScore(average(allFinalScores, FinalScoreEntity::getAssessmentScore))
                .averageFinalScore(average(allFinalScores, FinalScoreEntity::getFinalScore))
                .build();
    }

    /**
     * คำนวณค่าเฉลี่ย — ถ้ายังไม่มีข้อมูลเลยคืน 0.00 แทนที่จะหารด้วยศูนย์
     */
    private BigDecimal average(List<FinalScoreEntity> scores,
                               java.util.function.Function<FinalScoreEntity, BigDecimal> extractor) {
        if (scores.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal sum = scores.stream()
                .map(extractor)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return sum.divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP);
    }
}