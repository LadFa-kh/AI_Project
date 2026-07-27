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

export function HowItWorksSection() {
  return (
    <section className="bg-home-surface py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-center text-2xl font-semibold text-home-text-primary md:text-3xl">
          ขั้นตอนการใช้งาน
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <span className="font-heading flex h-12 w-12 items-center justify-center rounded-full bg-home-primary text-lg font-semibold text-white">
                {step.number}
              </span>
              <h3 className="font-heading mt-4 text-lg font-semibold text-home-text-primary">
                {step.title}
              </h3>
              <p className="font-body mt-2 text-sm text-home-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
