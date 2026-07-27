export type WorkMode = "onsite" | "hybrid" | "remote";

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: "ทำงานที่บริษัท",
  hybrid: "ไฮบริด",
  remote: "ทำงานทางไกล",
};

export type InternshipMatch = {
  internshipId: string;
  title: string;
  company: string;
  matchScore: number;
  requiredSkills: string[];
  location: string;
  workMode: WorkMode;
  matchReason: string;
  postedAt: string; // ISO date
};

export type SortOption = "matchScore" | "newest";

export type MatchFilters = {
  workMode: WorkMode | "all";
  location: string | "all";
};

// Mock data until backend is wired (see PROJECT_CONTEXT.md: GET /internships/matches)
export const MOCK_MATCHES: InternshipMatch[] = [
  {
    internshipId: "1",
    title: "Frontend Developer Intern",
    company: "บริษัท เทคโนโลยี จำกัด",
    matchScore: 92,
    requiredSkills: ["React", "JavaScript", "CSS"],
    location: "กรุงเทพฯ",
    workMode: "hybrid",
    matchReason: "ทักษะ React และ JavaScript ของคุณตรงกับตำแหน่งนี้มาก",
    postedAt: "2026-07-20",
  },
  {
    internshipId: "2",
    title: "Data Analyst Intern",
    company: "บริษัท ดาต้า อินไซต์ จำกัด",
    matchScore: 81,
    requiredSkills: ["SQL", "Excel", "การสื่อสาร"],
    location: "เชียงใหม่",
    workMode: "remote",
    matchReason: "ทักษะการสื่อสารและพื้นฐาน SQL สอดคล้องกับงานนี้",
    postedAt: "2026-07-24",
  },
  {
    internshipId: "3",
    title: "Software Engineer Intern",
    company: "บริษัท โค้ดดิ้ง โซลูชัน จำกัด",
    matchScore: 75,
    requiredSkills: ["JavaScript", "SQL", "การทำงานเป็นทีม"],
    location: "กรุงเทพฯ",
    workMode: "onsite",
    matchReason: "พื้นฐาน JavaScript ที่แข็งแรงเหมาะกับทีมพัฒนา",
    postedAt: "2026-07-15",
  },
];
