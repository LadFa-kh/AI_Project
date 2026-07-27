import type { InternshipMatch } from "./match-types";

export type InternshipDetail = InternshipMatch & {
  stipend: string | null;
  duration: string;
  deadline: string; // ISO date
  matchedSkills: string[];
  missingSkills: string[];
  recommendedDocuments: string[];
  skillsToImprove: string[];
};

// Mock data until backend detail endpoint is wired (see checklist below)
export const MOCK_MATCH_DETAILS: Record<string, InternshipDetail> = {
  "1": {
    internshipId: "1",
    title: "Frontend Developer Intern",
    company: "บริษัท เทคโนโลยี จำกัด",
    matchScore: 92,
    requiredSkills: ["React", "JavaScript", "CSS"],
    location: "กรุงเทพฯ",
    workMode: "hybrid",
    matchReason: "ทักษะ React และ JavaScript ของคุณตรงกับตำแหน่งนี้มาก",
    postedAt: "2026-07-20",
    stipend: "15,000 บาท/เดือน",
    duration: "4 เดือน",
    deadline: "2026-08-15",
    matchedSkills: ["React", "JavaScript"],
    missingSkills: ["CSS"],
    recommendedDocuments: ["เรซูเม่ฉบับล่าสุด", "Portfolio โปรเจกต์", "Transcript"],
    skillsToImprove: ["CSS / Responsive Design"],
  },
  "2": {
    internshipId: "2",
    title: "Data Analyst Intern",
    company: "บริษัท ดาต้า อินไซต์ จำกัด",
    matchScore: 81,
    requiredSkills: ["SQL", "Excel", "การสื่อสาร"],
    location: "เชียงใหม่",
    workMode: "remote",
    matchReason: "ทักษะการสื่อสารและพื้นฐาน SQL สอดคล้องกับงานนี้",
    postedAt: "2026-07-24",
    stipend: "12,000 บาท/เดือน",
    duration: "3 เดือน",
    deadline: "2026-08-10",
    matchedSkills: ["การสื่อสาร"],
    missingSkills: ["SQL", "Excel"],
    recommendedDocuments: ["เรซูเม่ฉบับล่าสุด", "จดหมายแนะนำตัว"],
    skillsToImprove: ["SQL ขั้นสูง", "Excel สำหรับวิเคราะห์ข้อมูล"],
  },
  "3": {
    internshipId: "3",
    title: "Software Engineer Intern",
    company: "บริษัท โค้ดดิ้ง โซลูชัน จำกัด",
    matchScore: 75,
    requiredSkills: ["JavaScript", "SQL", "การทำงานเป็นทีม"],
    location: "กรุงเทพฯ",
    workMode: "onsite",
    matchReason: "พื้นฐาน JavaScript ที่แข็งแรงเหมาะกับทีมพัฒนา",
    postedAt: "2026-07-15",
    stipend: null,
    duration: "6 เดือน",
    deadline: "2026-08-01",
    matchedSkills: ["JavaScript", "การทำงานเป็นทีม"],
    missingSkills: ["SQL"],
    recommendedDocuments: ["เรซูเม่ฉบับล่าสุด", "Transcript"],
    skillsToImprove: ["SQL พื้นฐาน"],
  },
};
