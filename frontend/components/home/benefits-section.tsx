import { ScrollReveal } from "./scroll-reveal";

const BENEFITS = [
  {
    title: "วิเคราะห์เรซูเม่ด้วย AI",
    description: "ดึงทักษะสำคัญจากเรซูเม่ของคุณโดยอัตโนมัติ ไม่ต้องกรอกข้อมูลซ้ำ",
  },
  {
    title: "ประเมินทักษะแบบเลือกตอบ",
    description: "เลือกระดับความสามารถของคุณได้ง่าย รวดเร็ว ไม่ต้องเขียนคำตอบยาว",
  },
  {
    title: "จับคู่ฝึกงานที่แม่นยำ",
    description: "รับคำแนะนำสถานที่ฝึกงานที่ตรงกับทักษะและความสนใจของคุณ",
  },
];

export function BenefitsSection() {
  return (
    <section className="relative flex h-full flex-col justify-center bg-home-bg px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,8vw,6rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(252,131,55,0.10),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(252,131,55,0.05),_transparent_50%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl">
        <h2 className="font-heading text-center text-[clamp(1.375rem,1.1rem+1.2vw,1.875rem)] font-semibold text-home-text-primary">
          ทำไมต้องใช้ระบบนี้
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <ScrollReveal key={benefit.title} delayMs={index * 90}>
              <div className="h-full rounded-2xl border border-home-border bg-home-surface p-6">
                <h3 className="font-heading text-lg font-semibold text-home-text-primary">
                  {benefit.title}
                </h3>
                <p className="font-body mt-2 text-sm text-home-text-secondary">
                  {benefit.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
