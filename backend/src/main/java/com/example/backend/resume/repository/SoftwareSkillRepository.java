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

    // B1: ทักษะยอดนิยม (hot technology) ของตำแหน่งนั้น — ใช้เลือก missingSkills ที่มีความหมาย
    @Query(value = """
        SELECT DISTINCT s.workplace_example
        FROM software_skills s
        WHERE s.title ILIKE CONCAT('%', :query, '%')
          AND s.hot_technology = 'Y'
        """, nativeQuery = true)
    List<String> findHotSkillNamesByTitleQuery(@Param("query") String query);

    // B1: ความนิยมของทักษะ = จำนวนอาชีพสาย IT (15-12xx) ที่ติดป้าย Hot Technology ให้ทักษะนั้น
    // ใช้เรียง missingSkills ให้ของที่ตลาดใช้กว้างที่สุด (AWS, Kubernetes) ขึ้นก่อนของเฉพาะทาง (Adobe Photoshop)
    @Query(value = """
        SELECT s.workplace_example
        FROM software_skills s
        WHERE s.hot_technology = 'Y' AND s.onet_soc_code LIKE '15-12%'
        GROUP BY s.workplace_example
        ORDER BY COUNT(DISTINCT s.onet_soc_code) DESC, s.workplace_example ASC
        """, nativeQuery = true)
    List<String> findItHotSkillsByPopularity();
}
