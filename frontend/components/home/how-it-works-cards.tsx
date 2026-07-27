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
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-center text-2xl font-semibold text-slate-100 md:text-3xl">
          ขั้นตอนการใช้งาน
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg shadow-black/20 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
            >
              <span className="font-heading flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-semibold text-white">
                {step.number}
              </span>
              <h3 className="font-heading mt-4 text-lg font-semibold text-slate-100">
                {step.title}
              </h3>
              <p className="font-body mt-2 text-sm leading-relaxed text-slate-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
