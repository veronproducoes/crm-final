"use client";

import { useTheme } from "@/lib/theme";

export function ToggleSwitch({ on, onClick, color }: { on: boolean; onClick: () => void; color?: string }) {
  const T = useTheme();
  return (
    <button
      onClick={onClick}
      className="relative rounded-full shrink-0 transition-colors"
      style={{ width: 38, height: 21, background: on ? color || T.brand : T.line }}
    >
      <span
        className="absolute rounded-full bg-white transition-transform"
        style={{ width: 17, height: 17, top: 2, left: 2, transform: on ? "translateX(17px)" : "translateX(0)" }}
      />
    </button>
  );
}
