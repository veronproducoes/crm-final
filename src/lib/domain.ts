// Constantes de domínio compartilhadas entre backend e frontend.
// Espelham fielmente o protótipo (crm-prototipo.jsx).

export const brands = [
  { id: "veron", dbValue: "VERON", name: "Veron Produções", color: "#E5484D" },
  { id: "arena360", dbValue: "ARENA360", name: "Arena 360", color: "#4C6EF5" },
] as const;

export type BrandId = (typeof brands)[number]["id"];

export function brandById(id: string) {
  return brands.find((b) => b.id === id);
}
export function brandByDbValue(v: string) {
  return brands.find((b) => b.dbValue === v);
}

export const origins = ["Indicação", "Instagram", "Google Ads", "Site", "Evento", "Cold Call"];

// tipo de atividade -> rótulo em pt-BR (o valor no banco é o enum ActivityType)
export const activityTypeLabels: Record<string, string> = {
  OBSERVACAO: "Observação",
  LIGACAO: "Ligação",
  REUNIAO: "Reunião",
  VISITA: "Visita",
  PROPOSTA: "Proposta",
  PENDENCIA: "Pendência",
  DESCARTADO: "Descartado (sem interesse)",
};
export const activityTypeOptions = Object.entries(activityTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export function labelToActivityType(label: string): string {
  const entry = Object.entries(activityTypeLabels).find(([, l]) => l === label);
  return entry ? entry[0] : "OBSERVACAO";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function colorFor(str: string) {
  const palette = ["#4C6EF5", "#0F9D8B", "#F5A623", "#9C6ADE", "#E5484D", "#12B76A", "#EF6C9B"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export function historyTypeColor(type: string) {
  if (type === "DESCARTADO") return "#E5484D";
  return colorFor(activityTypeLabels[type] || type);
}

export function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  COMERCIAL: "Comercial",
  FINANCEIRO: "Financeiro",
};
