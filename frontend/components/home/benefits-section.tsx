"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { BenefitIcon } from "./benefit-icon";
import type { BenefitIconKind } from "./benefit-icon-scene";
import { AmbientNetworkCanvas } from "./ambient-network-canvas";
import styles from "./benefits-section.module.css";

const BENEFITS: { icon: BenefitIconKind; title: string; description: string }[] = [
  {
    icon: "extract",
    title: "วิเคราะห์เรซูเม่ด้วย AI",
    description: "ดึงทักษะสำคัญจากเรซูเม่ของคุณโดยอัตโนมัติ ไม่ต้องกรอกข้อมูลซ้ำ",
  },
  {
    icon: "select",
    title: "ประเมินทักษะแบบเลือกตอบ",
    description: "เลือกระดับความสามารถของคุณได้ง่าย รวดเร็ว ไม่ต้องเขียนคำตอบยาว",
  },
  {
    icon: "connect",
    title: "จับคู่ฝึกงานที่แม่นยำ",
    description: "รับคำแนะนำสถานที่ฝึกงานที่ตรงกับทักษะและความสนใจของคุณ",
  },
];

function BenefitCard({
  benefit,
  entranceDelayMs,
}: {
  benefit: (typeof BENEFITS)[number];
  entranceDelayMs: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BenefitIcon kind={benefit.icon} hovered={hovered} entranceDelayMs={entranceDelayMs} />
      <h3 className={styles.cardTitle}>{benefit.title}</h3>
      <p className={styles.cardDescription}>{benefit.description}</p>
    </div>
  );
}

export function BenefitsSection() {
  return (
    <section className="relative flex h-full flex-col justify-center overflow-hidden bg-home-bg px-[clamp(1rem,4vw,2rem)] py-[clamp(2.5rem,8vw,6rem)]">
      {/* Lowest layer: lightweight CSS gradient — always present as the
          mobile/no-JS/pre-mount fallback, continuing the ambient glow from
          HomeHero and HowItWorksCards above. */}
      <div aria-hidden="true" className={styles.ambientFallback} />

      {/* Sparse 3D network — desktop only, mounts when section is in view.
          Reuses the exact same ambient component as HowItWorksCards. */}
      <AmbientNetworkCanvas />

      <div className="relative mx-auto w-full max-w-6xl">
        <h2 className={styles.sectionHeading}>ทำไมต้องใช้ระบบนี้</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <ScrollReveal key={benefit.title} delayMs={index * 90}>
              <BenefitCard benefit={benefit} entranceDelayMs={index * 90} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
