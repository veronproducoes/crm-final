"use client";

import { initials, colorFor, brandById } from "@/lib/domain";
import { useTheme } from "@/lib/theme";
import type { BrandDb } from "@/types";

export function brandRingStyle(brandsDb: BrandDb[] | undefined, T: ReturnType<typeof useTheme>) {
  const ids = (brandsDb || []).map((b) => (b === "VERON" ? "veron" : "arena360"));
  const cols = ids.map((id) => brandById(id)?.color).filter(Boolean) as string[];
  if (cols.length === 0) return {};
  if (cols.length === 1) {
    return { boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 4px ${cols[0]}` };
  }
  let shadow: string[] = [];
  let offset = 2;
  cols.slice(0, 2).forEach((c) => {
    shadow.push(`0 0 0 ${offset}px ${T.surface}`);
    offset += 2;
    shadow.push(`0 0 0 ${offset}px ${c}`);
    offset += 2;
  });
  return { boxShadow: shadow.join(", ") };
}

export function Avatar({
  name,
  size = 36,
  color,
  src,
  ringStyle,
}: {
  name: string;
  size?: number;
  color?: string;
  src?: string | null;
  ringStyle?: React.CSSProperties;
}) {
  const c = color || colorFor(name);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, ...ringStyle }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{ width: size, height: size, background: c + "22", color: c, fontSize: size * 0.38, ...ringStyle }}
    >
      {initials(name)}
    </div>
  );
}
