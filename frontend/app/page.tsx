import { HomeSidebar } from "@/components/home/home-sidebar";
import { HomeTopbar } from "@/components/home/home-topbar";
import { HomeHero } from "@/components/home/home-hero";
import { HowItWorksCards } from "@/components/home/how-it-works-cards";
import { BenefitsSection } from "@/components/home/benefits-section";
import { MetricsSection } from "@/components/home/metrics-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { FooterSection } from "@/components/home/footer-section";

export default function Home() {
  return (
    <div className="flex flex-1 bg-gradient-to-b from-[#0B1020] via-[#111827] to-[#0F172A]">
      <HomeSidebar />
      <div className="flex flex-1 flex-col lg:pl-60">
        <HomeTopbar />
        <HomeHero />
        <HowItWorksCards />
        <BenefitsSection />
        <MetricsSection />
        <FinalCtaSection />
        <FooterSection />
      </div>
    </div>
  );
}
