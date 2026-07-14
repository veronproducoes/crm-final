"use client";
import { AIAnalysisView } from "@/components/views/AIAnalysisView";
import { useAppData } from "@/lib/useAppData";

export default function Page() {
  const { perms } = useAppData();
  return <AIAnalysisView canRun={perms.canRunAIAnalysis} />;
}
