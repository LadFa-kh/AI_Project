import type { Metadata } from "next";
import { EvaluationResultCard } from "@/components/result/evaluation-result-card";
import nocturne from "@/components/ui/nocturne.module.css";

export const metadata: Metadata = {
  title: "Your evaluation",
};

export default function EvaluationResultPage() {
  return (
    <div className={nocturne.page}>
      <EvaluationResultCard />
    </div>
  );
}
