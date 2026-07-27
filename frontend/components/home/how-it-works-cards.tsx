import { ScrollReveal } from "./scroll-reveal";

const STEPS = [
  {
    number: "1",
    title: "อัปโหลดเรซูเม่",
    description: "อัปโหลดไฟล์ PDF หรือ Word ของคุณเพื่อเริ่มต้น",
  },
  {
    number: "2",
    title: "ประเมินทักษะ",
    description: "เลือกระดับความสามารถของคุณในแต่ละทักษะที่ระบบตรวจพบ",
  },
  {
    number: "3",
    title: "รับผลจับคู่ฝึกงาน",
    description: "ดูผลประเมินและรายชื่อสถานที่ฝึกงานที่เหมาะกับคุณ",
  },
];

export function HowItWorksCards() {
  return (
    <section className="relative flex h-full flex-col justify-center bg-home-bg px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,8vw,6rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(252,131,55,0.10),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(252,131,55,0.05),_transparent_50%)]"
      />
      <div className="relative mx-auto w-full max-w-5xl">
        <h2 className="font-heading text-center text-[clamp(1.375rem,1.1rem+1.2vw,1.875rem)] font-semibold text-home-text-primary">
          ขั้นตอนการใช้งาน
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <ScrollReveal key={step.number} delayMs={index * 90}>
              <div className="h-full rounded-2xl border border-home-border bg-home-surface p-6">
                <span
                  className="font-heading flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold text-white"
                  style={{ backgroundColor: "#FC8337" }}
                >
                  {step.number}
                </span>
                <h3 className="font-heading mt-4 text-lg font-semibold text-home-text-primary">
                  {step.title}
                </h3>
                <p className="font-body mt-2 text-sm text-home-text-secondary">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
