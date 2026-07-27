import Link from "next/link";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.35),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.25),_transparent_50%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 text-center md:px-6 lg:px-8">
        <h1 className="font-heading mx-auto max-w-3xl text-4xl font-bold leading-tight text-slate-100 md:text-6xl">
          วิเคราะห์เรซูเม่ ประเมินทักษะ{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            จับคู่ฝึกงานที่ใช่สำหรับคุณ
          </span>
        </h1>
        <p className="font-body mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
          อัปโหลดเรซูเม่ ให้ AI ประเมินทักษะของคุณ แล้วรับคำแนะนำสถานที่ฝึกงานที่เหมาะกับคุณที่สุด
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="font-body flex h-12 w-full items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-950/50 transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:w-auto"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="font-body flex h-12 w-full items-center justify-center rounded-lg border border-slate-700 px-6 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:w-auto"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </section>
  );
}
