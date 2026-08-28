import type { Metadata } from "next";
import { EvaluationResultFlow } from "@/components/result/evaluation-result-flow";

export const metadata: Metadata = {
  title: "ผลการประเมิน",
};

export default function EvaluationResultPage() {
  return <EvaluationResultFlow />;
}
