"use client";

import { useTheme } from "@/lib/theme";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  trend?: number;
}) {
  const T = useTheme();
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-150"
      style={{ background: T.surface, border: `1px solid ${T.line}` }}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
          <Icon size={19} color={color} />
        </div>
        {trend != null && (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: trend >= 0 ? "#12B76A" : "#E5484D" }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          {value}
        </div>
        <div className="text-base mt-0.5" style={{ color: T.textMuted }}>
          {label}
        </div>
      </div>
    </div>
  );
}
