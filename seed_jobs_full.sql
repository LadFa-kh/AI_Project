-- ============================================================
-- Seed ข้อมูลประกาศงานทั้งหมด 37 รายการ (พร้อมรายละเอียดครบทุก field)
-- ============================================================
-- วิธีใช้ (อย่ารันผ่าน PowerShell pipe เด็ดขาด — ภาษาไทยจะเพี้ยน):
--   docker cp seed_jobs_full.sql ai_project-postgres-1:/tmp/seed.sql
--   docker exec -it ai_project-postgres-1 psql -U postgres -d resumeAnalysisRecommendation -f /tmp/seed.sql
--
-- employer_id ดึงจาก user ตัวแรกที่มีในระบบ (FK บังคับให้ต้องมีอยู่จริง)
-- ============================================================

INSERT INTO job_description
    (id, company_name, job_type, position_name, required_skills,
     job_description, duration, salary, contact_link, employer_id)
VALUES

-- ══════════ ชุดเดิม 12 รายการ ══════════
(gen_random_uuid(), 'บริษัท เว็บฟอร์จ สตูดิโอ จำกัด', 'Full-time', 'Web Developer',
 'JavaScript,TypeScript,React,Node.js,PHP',
 'รับผิดชอบการพัฒนาเว็บแอปพลิเคชันทั้งฝั่งหน้าบ้านและหลังบ้าน ทำงานร่วมกับทีมออกแบบและทีมพัฒนาในการวิเคราะห์ ออกแบบ และทดสอบระบบ พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการปฏิบัติงาน',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/webforge', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท อินไซต์ ดาต้าแล็บ จำกัด', 'Full-time', 'Data Scientist',
 'Python,Apache Spark,Tableau,Structured query language SQL',
 'วิเคราะห์ข้อมูลขนาดใหญ่เพื่อสร้างแบบจำลองเชิงทำนาย จัดทำรายงานและแดชบอร์ดสำหรับผู้บริหาร ทำงานร่วมกับทีมวิศวกรข้อมูลในการเตรียมและทำความสะอาดชุดข้อมูล',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/insightdata', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เน็ตเวิร์ค อาร์คิเทค กรุ๊ป จำกัด', 'Full-time', 'Network Architect',
 'Wireshark,Linux,Amazon Web Services AWS software',
 'ออกแบบและวางสถาปัตยกรรมเครือข่ายองค์กร ดูแลความปลอดภัยและประสิทธิภาพของระบบเครือข่าย รวมถึงการวางแผนขยายระบบรองรับการเติบโตในอนาคต',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/netarch', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ดาต้าคอร์ เทคโนโลยี จำกัด', 'Full-time', 'Database Administrator',
 'MySQL,PostgreSQL,Structured query language SQL,Oracle Database',
 'ดูแลและบำรุงรักษาระบบฐานข้อมูลขององค์กร ปรับแต่งประสิทธิภาพการทำงาน วางแผนสำรองและกู้คืนข้อมูล พร้อมดูแลความปลอดภัยของข้อมูล',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/datacore', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ฮาร์ดแวร์ เอ็นจิเนียริง จำกัด', 'Full-time', 'Hardware Engineer',
 'C++,Linux,Git',
 'ออกแบบและพัฒนาระบบสมองกลฝังตัว เขียนโปรแกรมควบคุมอุปกรณ์ฮาร์ดแวร์ ทดสอบและแก้ไขปัญหาระดับระบบ',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/hardwareeng', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท โค้ดเวฟ จำกัด', 'Full-time', 'Software Developer',
 'Python,JavaScript,React,Structured query language SQL,Git,Docker',
 'พัฒนาซอฟต์แวร์ตามความต้องการของลูกค้า ตั้งแต่การวิเคราะห์ ออกแบบ พัฒนา จนถึงการทดสอบและส่งมอบ ทำงานในรูปแบบ Agile ร่วมกับทีม',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/codewave', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เน็ตซิสเต็ม โซลูชั่น จำกัด', 'Full-time', 'Network Administrator',
 'Linux,Amazon Web Services AWS software,Wireshark',
 'ดูแลระบบเครือข่ายและเซิร์ฟเวอร์ขององค์กรให้ทำงานได้อย่างต่อเนื่อง ติดตามและแก้ไขปัญหาการเชื่อมต่อ จัดการสิทธิ์การเข้าถึงระบบ',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/netsystem', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท โปรแกรมเมอร์ ฮับ จำกัด', 'Internship', 'Computer Programmer',
 'Sun Microsystems Java,C#,JavaScript,Structured query language SQL',
 'ฝึกปฏิบัติงานพัฒนาโปรแกรมร่วมกับทีมพัฒนา เรียนรู้กระบวนการทำงานจริงในสภาพแวดล้อมแบบมืออาชีพ พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/programmerhub', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ไซเบอร์การ์ด จำกัด', 'Full-time', 'Information Security Analyst',
 'Python,Wireshark,Linux',
 'ตรวจสอบและวิเคราะห์ภัยคุกคามทางไซเบอร์ วางมาตรการป้องกันระบบสารสนเทศ จัดทำรายงานประเมินความเสี่ยงด้านความปลอดภัย',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/cyberguard', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท อนาไลติกส์ พาร์ทเนอร์ จำกัด', 'Full-time', 'Computer Systems Analyst',
 'Python,Structured query language SQL,Tableau,Microsoft Power BI',
 'วิเคราะห์ความต้องการทางธุรกิจและแปลงเป็นข้อกำหนดของระบบ ออกแบบกระบวนการทำงานและจัดทำเอกสารประกอบระบบ',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/analyticspartner', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท คิวเอ เทสต์ระบบ จำกัด', 'Full-time', 'QA Tester',
 'Selenium,JUnit,Postman',
 'ออกแบบและดำเนินการทดสอบซอฟต์แวร์ทั้งแบบอัตโนมัติและแบบใช้มือ จัดทำรายงานข้อบกพร่องและติดตามการแก้ไขร่วมกับทีมพัฒนา',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/qatest', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ไอทีเมเนจเมนท์ คอนซัลติ้ง จำกัด', 'Full-time', 'IT Systems Manager',
 'Python,Structured query language SQL,Tableau,Amazon Web Services AWS software',
 'บริหารจัดการระบบสารสนเทศขององค์กร วางแผนงบประมาณและทรัพยากรด้านไอที ดูแลทีมงานและประสานงานกับหน่วยงานที่เกี่ยวข้อง',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/itmanagement', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย Frontend / Web ══════════
(gen_random_uuid(), 'บริษัท ไบร์ทเว็บ ดีไซน์ จำกัด', 'Internship', 'Frontend Developer',
 'JavaScript,TypeScript,React,Git',
 'ฝึกปฏิบัติงานพัฒนาส่วนติดต่อผู้ใช้ของเว็บแอปพลิเคชัน เรียนรู้การทำงานร่วมกับทีมออกแบบและทีมหลังบ้าน พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/brightweb', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท พิกเซลเวิร์ค สตูดิโอ จำกัด', 'Full-time', 'UI Developer',
 'JavaScript,React,PHP,Git',
 'พัฒนาส่วนติดต่อผู้ใช้ให้สอดคล้องกับแบบที่ทีมออกแบบกำหนด ปรับปรุงประสบการณ์การใช้งานและประสิทธิภาพการแสดงผลบนอุปกรณ์หลากหลายชนิด',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/pixelwork', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เว็บสเปซ โซลูชั่น จำกัด', 'Internship', 'Junior Web Developer',
 'JavaScript,PHP,MySQL,Git',
 'ฝึกปฏิบัติงานพัฒนาเว็บไซต์ให้กับลูกค้าองค์กร เรียนรู้การจัดการฐานข้อมูลและการเชื่อมต่อระบบ พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/webspace', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย Backend / Full-stack ══════════
(gen_random_uuid(), 'บริษัท โค้ดคราฟท์ เทคโนโลยี จำกัด', 'Full-time', 'Backend Developer',
 'Python,PostgreSQL,Docker,Git',
 'พัฒนาและดูแลระบบหลังบ้าน ออกแบบ API และโครงสร้างฐานข้อมูล ปรับปรุงประสิทธิภาพและความเสถียรของระบบ',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/codecraft', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เซิร์ฟเวอร์ไลน์ ซิสเต็ม จำกัด', 'Full-time', 'Java Backend Engineer',
 'Sun Microsystems Java,PostgreSQL,Docker,JUnit',
 'พัฒนาระบบองค์กรขนาดใหญ่ด้วย Java ออกแบบสถาปัตยกรรมแบบ Microservices และเขียนชุดทดสอบอัตโนมัติเพื่อรักษาคุณภาพของโค้ด',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/serverline', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ฟูลสแตค อินโนเวชั่น จำกัด', 'Internship', 'Full-stack Developer',
 'JavaScript,Node.js,React,MySQL,Git',
 'ฝึกปฏิบัติงานพัฒนาระบบทั้งฝั่งหน้าบ้านและหลังบ้าน เรียนรู้กระบวนการพัฒนาซอฟต์แวร์แบบครบวงจร พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/fullstack', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เอพีไอ เฟิร์ส จำกัด', 'Full-time', 'API Developer',
 'Node.js,Postman,PostgreSQL,Docker',
 'ออกแบบและพัฒนา RESTful API สำหรับระบบภายในและคู่ค้าภายนอก จัดทำเอกสารประกอบและดูแลเรื่องความปลอดภัยของการเชื่อมต่อ',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/apifirst', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ดอทเน็ต โปรเฟสชันแนล จำกัด', 'Full-time', 'Software Engineer (.NET)',
 'C#,Structured query language SQL,Git',
 'พัฒนาระบบธุรกิจด้วยเทคโนโลยี .NET ดูแลระบบเดิมและพัฒนาฟีเจอร์ใหม่ตามความต้องการของผู้ใช้งาน',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/dotnetpro', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย Data / Analytics ══════════
(gen_random_uuid(), 'บริษัท ดาต้าไลท์ อนาไลติกส์ จำกัด', 'Full-time', 'Data Analyst',
 'Python,Structured query language SQL,Tableau,Microsoft Power BI',
 'วิเคราะห์ข้อมูลเชิงธุรกิจและจัดทำรายงานสนับสนุนการตัดสินใจ สร้างแดชบอร์ดติดตามตัวชี้วัดสำคัญขององค์กร',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/datalight', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท บิ๊กดาต้า เอเชีย จำกัด', 'Full-time', 'Data Engineer',
 'Python,Apache Spark,PostgreSQL,Structured query language SQL',
 'ออกแบบและดูแลระบบท่อส่งข้อมูล (Data Pipeline) จัดการข้อมูลขนาดใหญ่และปรับปรุงประสิทธิภาพการประมวลผล',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/bigdataasia', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท อินไซต์เมทริกซ์ จำกัด', 'Internship', 'Business Intelligence Analyst',
 'Microsoft Power BI,Tableau,Structured query language SQL',
 'ฝึกปฏิบัติงานจัดทำรายงานและแดชบอร์ดเชิงธุรกิจ เรียนรู้การดึงและแปลงข้อมูลจากหลายแหล่ง พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/insightmatrix', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เอไอ รีเสิร์ช แล็บ จำกัด', 'Full-time', 'Machine Learning Engineer',
 'Python,Apache Spark,Linux,Git',
 'พัฒนาและปรับปรุงแบบจำลองการเรียนรู้ของเครื่อง นำแบบจำลองขึ้นใช้งานจริงและติดตามประสิทธิภาพอย่างต่อเนื่อง',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/airesearch', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ดาต้าเวลท์ คอนซัลติ้ง จำกัด', 'Full-time', 'Database Developer',
 'Oracle Database,MySQL,Structured query language SQL',
 'ออกแบบโครงสร้างฐานข้อมูลและเขียนคำสั่งประมวลผลข้อมูลขั้นสูง ปรับแต่งประสิทธิภาพการค้นหาและจัดทำเอกสารประกอบ',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/datawealth', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย Infrastructure / DevOps / Network ══════════
(gen_random_uuid(), 'บริษัท คลาวด์เบส เทคโนโลยี จำกัด', 'Full-time', 'DevOps Engineer',
 'Docker,Linux,Amazon Web Services AWS software,Git',
 'ดูแลระบบ CI/CD และโครงสร้างพื้นฐานบนคลาวด์ ทำงานร่วมกับทีมพัฒนาเพื่อให้การส่งมอบซอฟต์แวร์เป็นไปอย่างราบรื่น',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/cloudbase', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เน็กซ์คลาวด์ เซอร์วิส จำกัด', 'Full-time', 'Cloud Engineer',
 'Amazon Web Services AWS software,Linux,Docker',
 'ออกแบบและดูแลสถาปัตยกรรมระบบบนคลาวด์ บริหารจัดการทรัพยากรและควบคุมค่าใช้จ่ายให้เหมาะสม',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/nextcloud', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ลิงก์เน็ต คอมมูนิเคชั่น จำกัด', 'Full-time', 'Network Engineer',
 'Wireshark,Linux,Amazon Web Services AWS software',
 'ติดตั้งและดูแลอุปกรณ์เครือข่าย ตรวจสอบและแก้ไขปัญหาการเชื่อมต่อ วางแผนปรับปรุงระบบให้รองรับการใช้งานที่เพิ่มขึ้น',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/linknet', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ซิสเต็มคอร์ อินฟรา จำกัด', 'Internship', 'System Administrator',
 'Linux,Docker,Structured query language SQL',
 'ฝึกปฏิบัติงานดูแลระบบเซิร์ฟเวอร์และบริการภายในองค์กร เรียนรู้การติดตั้งและบำรุงรักษาระบบ พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/systemcore', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เซฟการ์ด ไซเบอร์ จำกัด', 'Full-time', 'Security Engineer',
 'Wireshark,Linux,Python',
 'ออกแบบและติดตั้งระบบป้องกันภัยคุกคามทางไซเบอร์ ตรวจสอบช่องโหว่และจัดทำแนวปฏิบัติด้านความปลอดภัยให้องค์กร',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/safeguard', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เทรซเน็ต ซีเคียวริตี้ จำกัด', 'Internship', 'Junior Security Analyst',
 'Wireshark,Linux,Structured query language SQL',
 'ฝึกปฏิบัติงานตรวจสอบและวิเคราะห์เหตุการณ์ด้านความปลอดภัย เรียนรู้เครื่องมือตรวจจับภัยคุกคาม พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/tracenet', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย QA / Testing ══════════
(gen_random_uuid(), 'บริษัท ควอลิตี้เฟิร์ส ซอฟต์แวร์ จำกัด', 'Full-time', 'QA Automation Engineer',
 'Selenium,JUnit,Postman,Git',
 'พัฒนาชุดทดสอบอัตโนมัติสำหรับเว็บแอปพลิเคชันและ API ดูแลระบบทดสอบให้ทำงานร่วมกับกระบวนการส่งมอบซอฟต์แวร์',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/qualityfirst', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เทสต์แล็บ ดิจิทัล จำกัด', 'Internship', 'Software Tester',
 'Selenium,Postman,Structured query language SQL',
 'ฝึกปฏิบัติงานทดสอบซอฟต์แวร์ตามแผนการทดสอบ บันทึกและติดตามข้อบกพร่อง พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/testlab', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย Embedded / Systems ══════════
(gen_random_uuid(), 'บริษัท ไมโครชิป เอ็นจิเนียริ่ง จำกัด', 'Full-time', 'Embedded Software Engineer',
 'C++,Linux,Git',
 'พัฒนาซอฟต์แวร์สำหรับระบบสมองกลฝังตัว ทำงานใกล้ชิดกับทีมฮาร์ดแวร์ในการทดสอบและแก้ไขปัญหาระดับอุปกรณ์',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/microchip', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท ฮาร์ดคอร์ ซิสเต็ม จำกัด', 'Full-time', 'Systems Programmer',
 'C++,C#,Linux',
 'พัฒนาโปรแกรมระดับระบบและเครื่องมือภายในองค์กร ปรับแต่งประสิทธิภาพการทำงานและแก้ไขปัญหาเชิงลึก',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/hardcore', (SELECT id FROM users LIMIT 1)),

-- ══════════ สาย IT ทั่วไป / Support ══════════
(gen_random_uuid(), 'บริษัท ไอทีโปร เซอร์วิส จำกัด', 'Internship', 'IT Support Specialist',
 'Linux,Structured query language SQL,MySQL',
 'ฝึกปฏิบัติงานสนับสนุนผู้ใช้งานด้านเทคโนโลยีสารสนเทศ ดูแลอุปกรณ์และระบบภายในองค์กร พร้อมได้รับคำแนะนำจากพี่เลี้ยงตลอดระยะเวลาการฝึกงาน',
 '4 เดือน (ตามระยะเวลาฝึกงานสหกิจศึกษา)', 'เบี้ยเลี้ยง 500 บาท/วัน',
 'https://careers.example.com/apply/itpro', (SELECT id FROM users LIMIT 1)),

(gen_random_uuid(), 'บริษัท เอ็นเตอร์ไพรส์ ไอที โซลูชั่น จำกัด', 'Full-time', 'IT Systems Analyst',
 'Structured query language SQL,Oracle Database,Tableau,Linux',
 'วิเคราะห์และออกแบบระบบสารสนเทศให้ตอบโจทย์กระบวนการทางธุรกิจ ประสานงานระหว่างผู้ใช้งานและทีมพัฒนา',
 'สัญญาจ้างประจำ (ไม่กำหนดระยะเวลา)', '25,000 - 45,000 บาท/เดือน (ตามประสบการณ์)',
 'https://careers.example.com/apply/enterpriseit', (SELECT id FROM users LIMIT 1));


-- ══════════ ตรวจสอบผลลัพธ์ ══════════
SELECT COUNT(*) AS total_jobs FROM job_description;
SELECT company_name, position_name FROM job_description LIMIT 5;
