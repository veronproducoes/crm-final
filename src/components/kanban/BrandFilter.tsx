"use client";

import { useTheme } from "@/lib/theme";
import { brands } from "@/lib/domain";

export function BrandFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const T = useTheme();
  const options = [{ id: "todas", name: "Todas as marcas" }, ...brands];
  return (
    <select
      className="text-sm rounded-lg px-3 py-2"
      style={{ border: `1px solid ${T.line}`, background: T.surface, color: T.text }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
