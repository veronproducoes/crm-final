"use client";

import { useTheme } from "@/lib/theme";

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  const T = useTheme();
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: T.textMuted }}>
        {label}
      </label>
      {children}
    </div>
  );
}
