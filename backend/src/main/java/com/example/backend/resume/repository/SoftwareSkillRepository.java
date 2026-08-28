package com.example.backend.resume.repository;

import com.example.backend.resume.entity.SoftwareSkillEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SoftwareSkillRepository extends JpaRepository<SoftwareSkillEntity, Long> {

    @Query(value = """
    SELECT DISTINCT s.workplace_example
    FROM software_skills s
    WHERE s.onet_soc_code LIKE '15-12%'
      AND s.workplace_example IS NOT NULL
    ORDER BY s.workplace_example ASC
    """, nativeQuery = true)
    List<String> findAllComputerEngineeringSkillNames();

    @Query(value = """
    SELECT DISTINCT s.workplace_example
    FROM software_skills s
    WHERE s.onet_soc_code LIKE '15-12%'
      AND s.workplace_example IS NOT NULL
      AND s.workplace_example ILIKE CONCAT('%', :searchSkill, '%')
    ORDER BY s.workplace_example ASC
    """, nativeQuery = true)
    List<String> searchComputerEngineeringSkills(@Param("searchSkill") String searchSkill);

    @Query(value = """
        SELECT DISTINCT s.workplace_example
        FROM software_skills s
        WHERE s.workplace_example ILIKE CONCAT('%', :query, '%')
           OR s.element_name ILIKE CONCAT('%', :query, '%')
           OR s.title ILIKE CONCAT('%', :query, '%')
        ORDER BY s.workplace_example ASC
        """, nativeQuery = true)
    List<String> searchSkillNames(@Param("query") String query, Pageable pageable);

    // [FIX] เปลี่ยนจาก JPQL เป็น native query — ใช้ชื่อ column DB ตรงๆ แทนการเดาชื่อ field ใน Entity
    @Query(value = """
            SELECT DISTINCT s.workplace_example
            FROM software_skills s
            WHERE s.workplace_example IN :names
            """, nativeQuery = true)
    List<String> findValidSkillNames(@Param("names") List<String> names);

    @Query(value = """
        SELECT DISTINCT s.workplace_example
        FROM software_skills s
        WHERE s.hot_technology = 'Y'
        ORDER BY s.workplace_example ASC
        """, nativeQuery = true)
    List<String> findHotTechnologySkills(Pageable pageable);

    // เพิ่มใน SoftwareSkillRepository
    @Query(value = """
        SELECT DISTINCT s.workplace_example
        FROM software_skills s
        WHERE s.title ILIKE CONCAT('%', :query, '%')
        """, nativeQuery = true)
    List<String> findSkillNamesByTitleQuery(@Param("query") String query);
}