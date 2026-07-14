"use client";

import { useTheme } from "@/lib/theme";

export function ThemedShell({ children }: { children: React.ReactNode }) {
  const T = useTheme();
  return (
    <div className="flex min-h-screen" style={{ background: T.canvas }}>
      {children}
    </div>
  );
}
