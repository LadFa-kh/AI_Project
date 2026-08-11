import Link from "next/link";
import { HeroSceneCanvas } from "./hero-scene-canvas";

export function HomeHero() {
  return (
    <section className="relative flex h-full min-h-full flex-col items-center justify-center bg-home-bg px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,8vw,6rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(252,131,55,0.10),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(252,131,55,0.05),_transparent_50%)]"
      />
      <HeroSceneCanvas />
      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-[clamp(1.75rem,1.3rem+2.2vw,3rem)] font-bold text-home-text-primary">
          วิเคราะห์เรซูเม่ ประเมินทักษะ
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-home-primary to-home-accent bg-clip-text text-transparent">
            จับคู่ฝึกงานที่ใช่สำหรับคุณ
          </span>
        </h1>
        <p className="font-body mx-auto mt-4 max-w-2xl text-[clamp(0.9375rem,0.85rem+0.4vw,1.125rem)] text-home-text-secondary">
          อัปโหลดเรซูเม่ ให้ AI ประเมินทักษะของคุณ แล้วรับคำแนะนำสถานที่ฝึกงานที่เหมาะกับคุณที่สุด
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="font-body flex h-12 w-full items-center justify-center rounded-full bg-home-primary px-6 text-sm font-medium text-white transition-colors hover:bg-home-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent sm:w-auto"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="font-body flex h-12 w-full items-center justify-center rounded-full border border-home-border px-6 text-sm font-medium text-home-text-primary transition-colors hover:bg-home-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent sm:w-auto"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </section>
  );
}
