"use client";

import { useTheme } from "@/lib/theme";
import type { LucideIcon } from "lucide-react";

export function EditField({
  icon: Icon,
  label,
  value,
  onChange,
  span2,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (v: string) => void;
  span2?: boolean;
}) {
  const T = useTheme();
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="text-xs font-medium flex items-center gap-2 mb-1" style={{ color: T.textMuted }}>
        <Icon size={14} />
        {label}
      </label>
      <input
        className="w-full text-sm rounded-lg px-2 py-1.5 outline-none"
        style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
