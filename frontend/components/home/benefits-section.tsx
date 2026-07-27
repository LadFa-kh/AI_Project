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
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <h2 className="font-heading text-center text-2xl font-semibold text-slate-100 md:text-3xl">
          ทำไมต้องใช้ระบบนี้
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg shadow-black/20 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
            >
              <h3 className="font-heading text-lg font-semibold text-slate-100">
                {benefit.title}
              </h3>
              <p className="font-body mt-2 text-sm leading-relaxed text-slate-300">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
