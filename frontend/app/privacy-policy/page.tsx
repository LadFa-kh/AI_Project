import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/legal/privacy-policy.module.css";

// Static copy of the policy the backend serves as current
// (GET /api/v1/policies/current → { version, url: "/privacy-policy", effectiveDate }).
// When the backend bumps the version, update these two constants together
// with the text below — API_CHANGES.md §5.9.
const POLICY_VERSION = "1.0";
const EFFECTIVE_DATE_LABEL = "24 กันยายน 2569";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว — ResuMate",
  description: "วิธีที่ ResuMate เก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)",
};

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
          ResuMate เป็นแพลตฟอร์มวิเคราะห์เรซูเม่ ประเมินทักษะ และจับคู่ตำแหน่งฝึกงานสำหรับนักศึกษา
          นโยบายนี้อธิบายว่าเราเก็บข้อมูลส่วนบุคคลอะไร นำไปใช้อย่างไร และคุณมีสิทธิ์อะไรบ้าง
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        </p>

        <section className={styles.section}>
          <h2>1. ข้อมูลที่เราเก็บ</h2>
          <ul>
            <li><strong>ข้อมูลบัญชี</strong> — ชื่อ-นามสกุล อีเมล รหัสผ่าน (เก็บแบบเข้ารหัส) หรือข้อมูลจากบัญชี Google เมื่อเข้าสู่ระบบด้วย Google</li>
            <li><strong>เรซูเม่และผลวิเคราะห์</strong> — ไฟล์เรซูเม่ที่คุณอัปโหลด ข้อความที่อ่านได้จากไฟล์ ทักษะที่ตรวจพบ และคะแนนประเมิน</li>
            <li><strong>แบบประเมินทักษะ</strong> — ระดับทักษะที่คุณเลือกในแบบประเมินตนเอง</li>
            <li><strong>ข้อมูลผู้ประกาศงาน</strong> — ชื่อบริษัท ข้อมูลติดต่อ และประกาศรับฝึกงาน (เฉพาะบัญชีผู้ประกาศงาน)</li>
            <li><strong>ข้อมูลการใช้งาน</strong> — ประวัติการยอมรับนโยบาย เวลาเข้าใช้งาน และคุกกี้ที่จำเป็นต่อระบบ</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>2. วัตถุประสงค์การใช้ข้อมูล</h2>
          <ul>
            <li>สร้างและดูแลบัญชีผู้ใช้ รวมถึงยืนยันตัวตนเมื่อเข้าสู่ระบบ</li>
            <li>วิเคราะห์เรซูเม่ ประเมินทักษะ และแนะนำอาชีพหรือตำแหน่งฝึกงานที่เหมาะกับคุณ</li>
            <li>ให้ผู้ประกาศงานลงประกาศและจัดการตำแหน่งฝึกงาน</li>
            <li>ปรับปรุงความถูกต้องของการจับคู่ ดูแลความปลอดภัย และป้องกันการใช้งานในทางที่ผิด</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. ฐานทางกฎหมาย</h2>
          <p>
            เราประมวลผลข้อมูลโดยอาศัย<strong>ความยินยอม</strong>ของคุณ (ที่ให้ไว้ตอนสมัครหรือเมื่อระบบขอให้ยอมรับนโยบาย)
            และความจำเป็นเพื่อให้บริการตามที่คุณร้องขอ คุณถอนความยินยอมได้ทุกเมื่อ
            แต่บางฟีเจอร์อาจใช้งานไม่ได้หลังถอนความยินยอม
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. การประมวลผลด้วย AI และการเปิดเผยข้อมูล</h2>
          <p>
            ข้อความจากเรซูเม่อาจถูกส่งไปยังผู้ให้บริการโมเดล AI ภายนอกเพื่อวิเคราะห์ทักษะเท่านั้น
            เราไม่ขายข้อมูลส่วนบุคคลของคุณ และจะเปิดเผยข้อมูลเฉพาะกรณีที่จำเป็นต่อการให้บริการ
            ได้รับความยินยอมจากคุณ หรือกฎหมายกำหนด
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. ระยะเวลาการเก็บรักษา</h2>
          <p>
            เราเก็บข้อมูลไว้ตลอดระยะเวลาที่บัญชียังเปิดใช้งาน เมื่อคุณลบบัญชี
            ข้อมูลส่วนบุคคลที่เกี่ยวข้องจะถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้
            เว้นแต่กฎหมายกำหนดให้ต้องเก็บไว้นานกว่านั้น
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. สิทธิ์ของคุณในฐานะเจ้าของข้อมูล</h2>
          <ul>
            <li><strong>สิทธิ์เข้าถึงและขอรับสำเนา</strong> — ดาวน์โหลดข้อมูลของคุณเป็นไฟล์ JSON ได้จาก<Link href="/settings" className={styles.link}>หน้าตั้งค่าบัญชี</Link></li>
            <li><strong>สิทธิ์ถอนความยินยอม</strong> — ถอนความยินยอมได้จาก<Link href="/settings" className={styles.link}>หน้าตั้งค่าบัญชี</Link></li>
            <li><strong>สิทธิ์ขอลบข้อมูล</strong> — ลบบัญชีและข้อมูลที่เกี่ยวข้องได้ด้วยตนเองที่<Link href="/settings" className={styles.link}>หน้าตั้งค่าบัญชี</Link></li>
            <li><strong>สิทธิ์ขอแก้ไข คัดค้าน หรือระงับการใช้ข้อมูล</strong> — ติดต่อผู้ดูแลระบบตามช่องทางด้านล่าง</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. คุกกี้</h2>
          <p>
            เราใช้เฉพาะคุกกี้ที่จำเป็น ได้แก่ คุกกี้เซสชันสำหรับการเข้าสู่ระบบ (httpOnly)
            และคุกกี้จดจำธีมสว่าง/มืด ไม่มีคุกกี้โฆษณาหรือติดตามข้ามเว็บไซต์
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. ความปลอดภัยของข้อมูล</h2>
          <p>
            รหัสผ่านถูกเก็บแบบเข้ารหัสทางเดียว การเชื่อมต่อใช้ HTTPS และจำกัดสิทธิ์การเข้าถึงข้อมูลตามบทบาทผู้ใช้
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. การเปลี่ยนแปลงนโยบาย</h2>
          <p>
            หากมีการแก้ไขนโยบาย เราจะเพิ่มเลขเวอร์ชันและขอให้คุณยอมรับนโยบายฉบับใหม่เมื่อเข้าสู่ระบบครั้งถัดไป
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. ติดต่อเรา</h2>
          <p>
            หากมีคำถามหรือต้องการใช้สิทธิ์ตามนโยบายนี้ กรุณาติดต่อผู้ดูแลระบบ ResuMate
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
