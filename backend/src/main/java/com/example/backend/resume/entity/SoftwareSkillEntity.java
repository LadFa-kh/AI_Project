package com.example.backend.resume.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "software_skills") // ชื่อตารางใน PostgreSQL ที่อิมพอร์ตมาจาก CSV
public class SoftwareSkillEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // หรือเปลี่ยนเป็นชนิดข้อมูลของ Primary Key ที่มีในตาราง CSV ของคุณแอ็กซ์

    // ใส่ Field หรือ Column อื่นๆ ตามตารางจริงใน Postgres ที่ต้องการใช้งาน
    // หรือถ้าจะใช้แค่ Query ดึงข้อมูลเฉยๆ แค่นี้ก็เพียงพอแล้วครับสำหรับทำ JpaRepository
}