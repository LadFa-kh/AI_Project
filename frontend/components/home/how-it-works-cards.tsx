"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { StepIcon } from "./step-icon";
import type { StepIconKind } from "./step-icon-scene";
import { AmbientNetworkCanvas } from "./ambient-network-canvas";
import styles from "./how-it-works.module.css";

const STEPS: { number: string; icon: StepIconKind; title: string; description: string }[] = [
  {
    number: "1",
    icon: "upload",
    title: "อัปโหลดเรซูเม่",
    description: "อัปโหลดไฟล์ PDF หรือ Word ของคุณเพื่อเริ่มต้น",
  },
  {
    number: "2",
    icon: "assessment",
    title: "ประเมินทักษะ",
    description: "เลือกระดับความสามารถของคุณในแต่ละทักษะที่ระบบตรวจพบ",
  },
  {
    number: "3",
    icon: "match",
    title: "รับผลจับคู่ฝึกงาน",
    description: "ดูผลประเมินและรายชื่อสถานที่ฝึกงานที่เหมาะกับคุณ",
  },
];

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <StepIcon kind={step.icon} number={step.number} hovered={hovered} />
      <h3 className={styles.cardTitle}>{step.title}</h3>
      <p className={styles.cardDescription}>{step.description}</p>
    </div>
  );
}

export function HowItWorksCards() {
  return (
    <section className="relative flex h-full flex-col justify-center overflow-hidden bg-home-bg px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,8vw,6rem)]">
      {/* Lowest layer: lightweight CSS gradient — always present as the
          mobile/no-JS/pre-mount fallback, continuing HomeHero's ambient glow. */}
      <div aria-hidden="true" className={styles.ambientFallback} />

      {/* Sparse 3D network — desktop only, mounts when section is in view. */}
      <AmbientNetworkCanvas />

      <div className="relative mx-auto w-full max-w-5xl">
        <h2 className={styles.sectionHeading}>ขั้นตอนการใช้งาน</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <ScrollReveal key={step.number} delayMs={index * 90}>
              <StepCard step={step} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
