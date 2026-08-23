import type { Metadata } from "next";
import { HomeBlobLayer } from "@/components/home/home-blob-layer";
import { HomeHeroDemo } from "@/components/home/home-hero-demo";
import { HowItWorksDemo } from "@/components/home/how-it-works-demo";

// Home ("/") now renders its own floating navbar + hero (HomeHeroDemo) +
// "ขั้นตอนการทำงาน" section + footer (HowItWorksDemo) and intentionally does
// NOT use the shared sidebar AppShell/FooterSection — see
// components/layout/app-shell.tsx's NO_NAV_ROUTES. Scope: Home only, per
// explicit request; every other route keeps the Stardust sidebar shell
// unchanged.
//
// HomeBlobLayer is mounted once here, as a sibling to both sections, so its
// decorative glow is one continuous layer spanning the whole page — matching
// the demo's <body>-level .blob elements. See home-blob-layer.tsx for why
// per-section blobs (an earlier attempt) caused a visible seam.
export const metadata: Metadata = {
  title: "AI_Project — วิเคราะห์เรซูเม่ จับคู่ฝึกงาน",
};

export default function Home() {
  return (
    <>
      <HomeBlobLayer />
      <HomeHeroDemo />
      <HowItWorksDemo />
    </>
  );
}
