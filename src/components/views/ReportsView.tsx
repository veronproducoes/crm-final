"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher } from "@/lib/fetcher";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

const REPORT_OPTIONS = [
  { id: "todos_ativos", label: "Todos os e-mails ativos" },
  { id: "veron_ativos", label: "Veron — ativos" },
  { id: "veron_inativos", label: "Veron — inativos" },
  { id: "arena360_ativos", label: "Arena 360 — ativos" },
  { id: "arena360_inativos", label: "Arena 360 — inativos" },
];

export function ReportsView() {
  const T = useTheme();
  const [report, setReport] = useState("todos_ativos");
  const { data } = useSWR(`/api/reports/emails?report=${report}`, fetcher);

  function downloadCsv() {
    window.location.href = `/api/reports/emails?report=${report}&format=csv`;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
        Relatórios
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMuted }}>
        Relatório de e-mails ativos/inativos por marca. A exportação em CSV contém apenas a coluna de e-mail.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {REPORT_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setReport(o.id)}
            className="text-sm font-medium px-4 py-3 rounded-xl text-left"
            style={{
              background: report === o.id ? T.brand + "18" : T.surface,
              color: report === o.id ? T.brand : T.text,
              border: `1px solid ${report === o.id ? T.brand : T.line}`,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5 shadow-sm mb-6" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold" style={{ color: T.text }}>
            {data ? `${data.items.length} e-mail(s) neste relatório` : "Carregando..."}
          </div>
          <button onClick={downloadCsv} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: T.brand }}>
            <Download size={15} /> Exportar CSV (somente e-mails)
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {data?.items.map((it: any) => (
            <div key={it.id} className="text-sm px-3 py-2 rounded-lg" style={{ background: T.surfaceAlt, color: T.text }}>
              {it.email} <span style={{ color: T.textMuted }}>— {it.company}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: T.text }}>
          Ainda não implementados neste MVP (escopo original)
        </div>
        <div className="flex flex-col gap-2 text-sm" style={{ color: T.textMuted }}>
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} /> Relatório de conversão por período/vendedor
          </div>
          <div className="flex items-center gap-2">
            <FileText size={15} /> Exportação em Excel e PDF
          </div>
        </div>
      </div>
    </div>
  );
}
