import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold text-slate-100 md:text-3xl">
          พร้อมเริ่มต้นแล้วหรือยัง?
        </h2>
        <p className="font-body mt-3 text-base leading-relaxed text-slate-300">
          สมัครสมาชิกวันนี้ เริ่มค้นหาฝึกงานที่ใช่สำหรับคุณ
        </p>
        <div className="mt-6">
          <Link
            href="/register"
            className="font-body inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-950/50 transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            สมัครสมาชิกฟรี
          </Link>
        </div>
      </div>
    </section>
  );
}
