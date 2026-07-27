// Mock metrics for MVP display (see PROJECT_CONTEXT.md — not wired to backend)
const METRICS = [
  { value: "1,200+", label: "นักศึกษาที่ใช้งาน" },
  { value: "350+", label: "ตำแหน่งฝึกงาน" },
  { value: "92%", label: "ความแม่นยำในการจับคู่" },
];

export function MetricsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center shadow-lg shadow-black/20 sm:grid-cols-3">
          {METRICS.map((metric) => (
            <div key={metric.label}>
              <p className="font-heading bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                {metric.value}
              </p>
              <p className="font-body mt-2 text-sm leading-relaxed text-slate-300">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
