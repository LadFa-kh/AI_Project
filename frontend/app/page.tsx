import type { Metadata } from "next";
import { HomeHero } from "@/components/home/home-hero";
import { HowItWorksCards } from "@/components/home/how-it-works-cards";
import { BenefitsSection } from "@/components/home/benefits-section";
import { HorizontalPageScroll } from "@/components/home/horizontal-page-scroll";
import { FooterSection } from "@/components/home/footer-section";

export const metadata: Metadata = {
  title: "AI_Project — วิเคราะห์เรซูเม่ จับคู่ฝึกงาน",
};

export default function Home() {
  return (
    <>
      <HorizontalPageScroll>
        <HomeHero />
        <HowItWorksCards />
        <BenefitsSection />
      </HorizontalPageScroll>
      <FooterSection />
    </>
  );
}
