"use client";

import Link from "next/link";
import { useState } from "react";
import { AssessmentProgress } from "@/components/assessment/assessment-progress";
import { SkillLevelCard } from "@/components/assessment/skill-level-card";
import {
  MOCK_SKILLS,
  type SkillAnswers,
  type SkillLevel,
} from "@/lib/assessment-types";

type Status = "default" | "loading" | "error" | "success";

export default function SkillAssessmentPage() {
  const skills = MOCK_SKILLS;
  const [answers, setAnswers] = useState<SkillAnswers>({});
  const [status, setStatus] = useState<Status>("default");
  const [formError, setFormError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === skills.length;
  const isLoading = status === "loading";
  const isSuccess = status === "success";

  function handleSelect(skillName: string, level: SkillLevel) {
    setAnswers((prev) => ({ ...prev, [skillName]: level }));
    setFormError(null);
  }

  async function handleSubmit() {
    if (!isComplete) {
      setFormError("กรุณาเลือกระดับให้ครบทุกทักษะก่อนส่งแบบประเมิน");
      return;
    }
    setStatus("loading");
    setFormError(null);
    try {
      // TODO: wire to backend (see PROJECT_CONTEXT.md contract: POST /assessments)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError("ส่งแบบประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-[clamp(24px,6vw,48px)] dark:bg-black">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-4 text-center" style={{ maxWidth: "min(24rem, 90vw)" }}>
          <h1 className="text-[clamp(1.375rem,1.1rem+1.2vw,1.5rem)] font-semibold text-zinc-900 dark:text-zinc-50">
            ส่งแบบประเมินสำเร็จ
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ระบบได้บันทึกคำตอบของคุณแล้ว
          </p>
          <Link
            href="/evaluation-result"
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            ดูผลประเมิน
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-[clamp(24px,6vw,48px)] dark:bg-black">
      <div className="w-full max-w-2xl mx-auto" style={{ maxWidth: "min(42rem, 90vw)" }}>
        <h1 className="text-[clamp(1.375rem,1.1rem+1.2vw,1.5rem)] font-semibold text-zinc-900 dark:text-zinc-50 text-center">
          ประเมินทักษะ
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-600 dark:text-zinc-400">
          เลือกระดับความสามารถของคุณในแต่ละทักษะ
        </p>

        <div className="mt-6">
          <AssessmentProgress answered={answeredCount} total={skills.length} />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {formError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {formError}
            </p>
          )}

          {skills.map((skill) => (
            <SkillLevelCard
              key={skill.skillName}
              skillName={skill.skillName}
              selected={answers[skill.skillName] ?? null}
              onSelect={(level) => handleSelect(skill.skillName, level)}
            />
          ))}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete || isLoading}
            className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
          </button>
        </div>
      </div>
    </div>
  );
}
