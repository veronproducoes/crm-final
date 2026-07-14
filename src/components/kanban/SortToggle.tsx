"use client";

import { useTheme } from "@/lib/theme";
import { ArrowDownAZ } from "lucide-react";

export function SortToggle({ active, onClick, compact }: { active: boolean; onClick: () => void; compact?: boolean }) {
  const T = useTheme();
  if (compact) {
    return (
      <button
        onClick={onClick}
        title="Ordenar leads em ordem alfabética"
        className="flex items-center justify-center p-1 rounded"
        style={{ background: active ? T.brand + "18" : "transparent" }}
      >
        <ArrowDownAZ size={14} color={active ? T.brand : T.textMuted} />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg"
      style={{
        background: active ? T.brand + "18" : T.surface,
        color: active ? T.brand : T.textMuted,
        border: `1px solid ${active ? T.brand : T.line}`,
      }}
    >
      <ArrowDownAZ size={15} />
      Ordem alfabética
    </button>
  );
}
