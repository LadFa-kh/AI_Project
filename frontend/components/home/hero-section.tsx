import Link from "next/link";

export function HeroSection() {
  return (
    <section className="bg-home-bg py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-home-text-primary sm:text-4xl md:text-5xl">
          วิเคราะห์เรซูเม่ ประเมินทักษะ
          <br className="hidden sm:block" /> จับคู่ฝึกงานที่ใช่สำหรับคุณ
        </h1>
        <p className="font-body mx-auto mt-4 max-w-2xl text-base text-home-text-secondary md:text-lg">
          อัปโหลดเรซูเม่ ให้ AI ประเมินทักษะของคุณ แล้วรับคำแนะนำสถานที่ฝึกงานที่เหมาะกับคุณที่สุด
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="font-body flex h-12 w-full items-center justify-center rounded-lg bg-home-primary px-6 text-sm font-medium text-white transition-colors hover:bg-home-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent sm:w-auto"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="font-body flex h-12 w-full items-center justify-center rounded-lg border border-home-border px-6 text-sm font-medium text-home-text-primary transition-colors hover:bg-home-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent sm:w-auto"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </section>
  );
}
