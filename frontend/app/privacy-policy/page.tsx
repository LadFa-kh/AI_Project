import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/legal/privacy-policy.module.css";

// Content follows the backend's draft docs/PRIVACY_POLICY_TH.md (written from
// what the system actually stores — API_CHANGES.md §5.13). Approved as the
// real v1.0 policy by the backend owner (FRONTEND_REQUESTS รอบ 4 ข้อ 3.5).
// Version must match GET /api/v1/policies/current → { version, url: "/privacy-policy" }.
// When the backend bumps the version, update these constants and the text together.
const POLICY_VERSION = "1.0";
const EFFECTIVE_DATE_LABEL = "24 กันยายน 2569";
/** Confirmed by backend (FRONTEND_REQUESTS รอบ 4 ข้อ 3.5) — ผู้ตรวจอนุมัติ: นายรัชพล ศรีชำนาญ. null = generic wording. */
const CONTACT_EMAIL: string | null = "ratchaponsrichamnan@gmail.com";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว — ResuMate",
  description: "วิธีที่ ResuMate เก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)",
};

function Contact() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>{CONTACT_EMAIL}</a>
  ) : (
    <>ผู้ดูแลระบบ ResuMate</>
  );
}

function SettingsLink() {
  return <Link href="/settings" className={styles.link}>หน้าตั้งค่าบัญชี</Link>;
}

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>ResuMate — PDPA</span>
        <h1 className={styles.title}>นโยบายความเป็นส่วนตัว</h1>
        <div className={styles.meta}>
          <span className={styles.metaChip}>เวอร์ชัน {POLICY_VERSION}</span>
          <span className={styles.metaChip}>มีผลตั้งแต่ {EFFECTIVE_DATE_LABEL}</span>
        </div>
      </header>

      <article className={styles.card}>
        <p className={styles.intro}>
          นโยบายนี้อธิบายว่า ResuMate เก็บข้อมูลส่วนบุคคลอะไร นำไปใช้อย่างไร ส่งให้ใคร เก็บนานเท่าไร
          และคุณใช้สิทธิ์ของคุณได้อย่างไร ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        </p>

        <section className={styles.section}>
          <h2>1. ผู้ควบคุมข้อมูล</h2>
          <p>
            ResuMate เป็นโครงงานของนักศึกษาสาขาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น
            ติดต่อเรื่องข้อมูลส่วนบุคคลได้ที่ <Contact />
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. ข้อมูลที่เราเก็บ</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>ประเภท</th><th>รายละเอียด</th></tr>
              </thead>
              <tbody>
                <tr><td>ข้อมูลบัญชี</td><td>อีเมล ชื่อ-นามสกุล เบอร์โทรศัพท์ (ถ้ากรอก) รหัสผ่านที่เข้ารหัสแล้ว (เราไม่เห็นรหัสผ่านจริง) และรหัสบัญชี Google กรณีเข้าสู่ระบบด้วย Google</td></tr>
                <tr><td>เรซูเม่</td><td>ไฟล์ PDF ที่อัปโหลด และทักษะที่ระบบสกัดได้จากเรซูเม่</td></tr>
                <tr><td>ผลการประเมิน</td><td>คำตอบแบบประเมินตนเอง คะแนนเรซูเม่ คะแนนแบบประเมิน คะแนนรวม ตำแหน่งงานที่สนใจ และคำแนะนำที่ระบบสร้าง</td></tr>
                <tr><td>ประวัติฝึกงาน</td><td>บริษัท ตำแหน่ง ช่วงเวลา ชื่อและอีเมลผู้ดูแลการฝึกงาน และบันทึกที่ผู้ใช้หรือบริษัทกรอก</td></tr>
                <tr><td>ข้อมูลบริษัท (ผู้ประกาศงาน)</td><td>ชื่อบริษัท เลขประจำตัวผู้เสียภาษี ที่อยู่ ช่องทางติดต่อ และประกาศงาน</td></tr>
                <tr><td>บันทึกการใช้งาน</td><td>ประเภทการใช้งาน (อัปโหลดเรซูเม่ / ส่งแบบประเมิน) เวลา ผลสำเร็จ เครดิตที่ใช้ และปริมาณการประมวลผลของ AI</td></tr>
                <tr><td>บันทึกความยินยอม</td><td>เวอร์ชันนโยบายที่ยอมรับ เวลาที่ยอมรับหรือถอน หมายเลข IP และข้อมูลเบราว์เซอร์ (User-Agent) ขณะยอมรับ</td></tr>
                <tr><td>คุกกี้</td><td>คุกกี้ <code>accessToken</code> สำหรับยืนยันตัวตน (HttpOnly อายุ 1 วัน) และคุกกี้จดจำธีมสว่าง/มืด ไม่มีคุกกี้โฆษณาหรือติดตาม</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2>3. วัตถุประสงค์การใช้ข้อมูล</h2>
          <ul>
            <li>ยืนยันตัวตนและให้บริการบัญชีผู้ใช้</li>
            <li>วิเคราะห์เรซูเม่ ประเมินทักษะ และแนะนำสายงานและสถานประกอบการที่เหมาะสม</li>
            <li>ให้ผู้ประกาศงานลงประกาศ และให้ผู้ดูแลระบบอนุมัติผู้ประกาศงาน</li>
            <li>จำกัดการใช้งาน (เครดิต) ป้องกันการใช้งานผิดวัตถุประสงค์ และคำนวณค่าใช้จ่ายของระบบ</li>
            <li>เก็บหลักฐานการให้ความยินยอมตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. การส่งข้อมูลให้บุคคลภายนอก</h2>
          <ul>
            <li>
              <strong>ผู้ให้บริการ AI</strong> — ข้อความที่อ่านได้จากเรซูเม่และทักษะ ถูกส่งไปประมวลผลผ่าน CometAPI
              ไปยังโมเดล Google Gemini เพื่อสกัดทักษะ สร้างแบบประเมิน และสร้างคำแนะนำ
            </li>
            <li><strong>Cloudflare</strong> — ใช้เป็นช่องทางเชื่อมต่อแบบเข้ารหัส (HTTPS) ระหว่างผู้ใช้กับเซิร์ฟเวอร์</li>
            <li>เราไม่ขายหรือให้ข้อมูลแก่บุคคลภายนอกเพื่อการตลาด</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. ระยะเวลาเก็บรักษา</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>ข้อมูล</th><th>ระยะเวลา</th></tr>
              </thead>
              <tbody>
                <tr><td>บัญชี เรซูเม่ ผลการประเมิน ประวัติฝึกงาน</td><td>จนกว่าผู้ใช้จะลบบัญชี</td></tr>
                <tr><td>บันทึกการใช้งาน</td><td>365 วัน แล้วลบอัตโนมัติ (เมื่อลบบัญชี จะตัดความเชื่อมโยงกับบัญชีทันที เหลือไว้เป็นสถิติที่ไม่ระบุตัวตน)</td></tr>
                <tr><td>บันทึกความยินยอม</td><td>จนกว่าผู้ใช้จะลบบัญชี</td></tr>
                <tr><td>ประกาศงาน</td><td>ยังคงอยู่หลังผู้ประกาศลบบัญชี แต่ไม่เชื่อมโยงกับบัญชีนั้นแล้ว</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2>6. สิทธิ์ของคุณในฐานะเจ้าของข้อมูล</h2>
          <ul>
            <li><strong>ขอดู / ขอสำเนาข้อมูล</strong> — ปุ่ม &quot;ดาวน์โหลดข้อมูลของฉัน&quot; ใน<SettingsLink /> (ไฟล์ JSON)</li>
            <li><strong>ขอลบข้อมูล</strong> — ปุ่ม &quot;ลบบัญชี&quot; ใน<SettingsLink /> ระบบจะลบบัญชี เรซูเม่พร้อมไฟล์ ผลการประเมิน ประวัติฝึกงาน และบันทึกความยินยอม</li>
            <li><strong>ถอนความยินยอม</strong> — ใน<SettingsLink /> (เมื่อถอนแล้ว ต้องยอมรับนโยบายใหม่ก่อนใช้งานต่อ)</li>
            <li><strong>ขอแก้ไขข้อมูล / คัดค้าน / ร้องเรียน</strong> — ติดต่อ <Contact /> หรือร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. ความปลอดภัยของข้อมูล</h2>
          <p>
            รหัสผ่านเข้ารหัสด้วย BCrypt การเชื่อมต่อเข้ารหัสด้วย HTTPS คุกกี้ยืนยันตัวตนเป็นแบบ HttpOnly
            ฐานข้อมูลไม่เปิดให้เข้าถึงจากอินเทอร์เน็ต และจำกัดจำนวนครั้งการเข้าสู่ระบบเพื่อป้องกันการเดารหัสผ่าน
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. การเปลี่ยนแปลงนโยบาย</h2>
          <p>
            เมื่อมีการแก้ไขนโยบาย เวอร์ชันจะเปลี่ยน และระบบจะขอให้ผู้ใช้ยอมรับนโยบายฉบับใหม่ในการเข้าใช้งานครั้งถัดไป
          </p>
        </section>
      </article>

      <footer className={styles.footer}>
        <span>นโยบายความเป็นส่วนตัว เวอร์ชัน {POLICY_VERSION}</span>
        <Link href="/" className={styles.link}>กลับสู่หน้าหลัก</Link>
      </footer>
    </main>
  );
}
