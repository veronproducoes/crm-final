"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher, apiRequest } from "@/lib/fetcher";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Sparkles, Check } from "lucide-react";
import type { ClientDto } from "@/types";

const labelColor: Record<string, string> = {
  Veron: "#E5484D",
  "Arena 360": "#4C6EF5",
  Ambas: "#12B76A",
  Indefinido: "#8B8FA8",
};

export function AIAnalysisView({ canRun }: { canRun: boolean }) {
  const T = useTheme();
  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);

  if (!clients) {
    return <div className="p-6 text-sm" style={{ color: T.textMuted }}>Carregando clientes...</div>;
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) => (s.size === clients!.length ? new Set() : new Set(clients!.map((c) => c.id))));
  }

  async function analyzeOne(id: string) {
    setRunning((s) => new Set(s).add(id));
    try {
      await apiRequest("/api/ai/analyze", "POST", { clientId: id });
      mutate("/api/clients");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRunning((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  async function analyzeBatch() {
    setBatchRunning(true);
    for (const id of selected) {
      await analyzeOne(id);
    }
    setBatchRunning(false);
  }

  async function applyToBrand(client: ClientDto) {
    const label = client.aiAnalysis?.brandLabel;
    if (!label || label === "Indefinido") return;
    const brands = label === "Ambas" ? ["VERON", "ARENA360"] : label === "Veron" ? ["VERON"] : ["ARENA360"];
    await apiRequest(`/api/clients/${client.id}`, "PATCH", { brands });
    mutate("/api/clients");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          <Sparkles size={20} color={T.brand} /> Análise de recomendação por IA
        </h1>
        {canRun && (
          <button
            onClick={analyzeBatch}
            disabled={selected.size === 0 || batchRunning}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ background: T.brand }}
          >
            {batchRunning ? "Analisando..." : `Analisar selecionados (${selected.size})`}
          </button>
        )}
      </div>
      <p className="text-sm mb-5" style={{ color: T.textMuted }}>
        A IA pesquisa informações públicas na web e recomenda se o cliente é mais aderente à Veron, Arena 360, Ambas ou Indefinido.
      </p>

      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <table className="w-full text-base">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.line}` }}>
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={selected.size === clients.length && clients.length > 0} onChange={toggleAll} />
              </th>
              {["Empresa", "Cidade", "Sugestão da IA", "Justificativa", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.textMuted }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={c.company} src={c.logoUrl} size={26} />
                    <span style={{ color: T.text }}>{c.company}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: T.textMuted }}>
                  {c.city}
                </td>
                <td className="px-4 py-3">
                  {c.aiAnalysis ? (
                    <Pill color={labelColor[c.aiAnalysis.brandLabel] || "#8B8FA8"}>{c.aiAnalysis.brandLabel}</Pill>
                  ) : (
                    <span className="text-xs" style={{ color: T.textMuted }}>
                      Não analisado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-xs text-xs" style={{ color: T.textMuted }}>
                  {c.aiAnalysis?.reasoning || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {canRun && (
                      <button
                        onClick={() => analyzeOne(c.id)}
                        disabled={running.has(c.id)}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                        style={{ border: `1px solid ${T.line}`, color: T.text }}
                      >
                        {running.has(c.id) ? "Analisando..." : "Analisar"}
                      </button>
                    )}
                    {canRun && c.aiAnalysis && c.aiAnalysis.brandLabel !== "Indefinido" && (
                      <button
                        onClick={() => applyToBrand(c)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-white"
                        style={{ background: T.brand }}
                      >
                        <Check size={12} /> Aplicar à marca
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
