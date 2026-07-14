"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { fetcher } from "@/lib/fetcher";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { UserPlus, TrendingUp, CheckCircle2, X, Users } from "lucide-react";
import { fmtDate } from "@/lib/domain";
import type { ClientDto, KanbanColumnDto } from "@/types";

export function DashboardView() {
  const T = useTheme();
  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);
  const { data: columns } = useSWR<KanbanColumnDto[]>("/api/columns", fetcher);

  const stats = useMemo(() => {
    if (!clients) return null;
    const count = (id: string) => clients.filter((c) => c.columnId === id).length;
    const total = clients.length;
    const leads = count("leads");
    const negociacao = clients.filter((c) => !["leads", "fechado", "perdido"].includes(c.columnId)).length;
    const fechados = count("fechado");
    const perdidos = count("perdido");
    const conversion = total ? Math.round((fechados / total) * 100) : 0;
    return { total, leads, negociacao, fechados, perdidos, conversion, count };
  }, [clients]);

  const recent = useMemo(() => {
    if (!clients) return [];
    const acts: { date: string; user: string; type: string; company: string }[] = [];
    clients.forEach((c) =>
      c.activities.forEach((h) => acts.push({ date: h.createdAt, user: h.user?.name || "—", type: h.type, company: c.company }))
    );
    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [clients]);

  if (!clients || !columns || !stats) {
    return <div className="p-6 text-sm" style={{ color: T.textMuted }}>Carregando painel...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
        Visão geral
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMuted }}>
        Resumo do funil de vendas e atividades recentes
      </p>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Leads" value={stats.leads} icon={UserPlus} color="#8B8FA8" />
        <StatCard label="Em negociação" value={stats.negociacao} icon={TrendingUp} color="#F5A623" />
        <StatCard label="Clientes fechados" value={stats.fechados} icon={CheckCircle2} color="#12B76A" />
        <StatCard label="Negócios perdidos" value={stats.perdidos} icon={X} color="#E5484D" />
        <StatCard label="Total de clientes" value={stats.total} icon={Users} color="#4C6EF5" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl p-5 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="text-sm font-semibold mb-4" style={{ color: T.text }}>
            Distribuição por etapa
          </div>
          <div className="space-y-3">
            {columns.map((col) => {
              const n = stats.count(col.id);
              const pct = stats.total ? (n / stats.total) * 100 : 0;
              return (
                <div key={col.id}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: T.textMuted }}>
                    <span>{col.name}</span>
                    <span>{n}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: T.canvas }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: col.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${T.line}` }}>
            <span className="text-xs" style={{ color: T.textMuted }}>
              Taxa de conversão
            </span>
            <span className="text-sm font-bold" style={{ color: T.brand }}>
              {stats.conversion}%
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-5 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="text-sm font-semibold mb-4" style={{ color: T.text }}>
            Últimas atividades
          </div>
          <div className="space-y-4">
            {recent.length === 0 && (
              <div className="text-sm" style={{ color: T.textMuted }}>
                Nenhuma atividade registrada.
              </div>
            )}
            {recent.map((a, i) => (
              <div key={i} className="flex gap-2.5">
                <Avatar name={a.user} size={26} />
                <div className="text-xs">
                  <div style={{ color: T.text }}>
                    <b>{a.user}</b> · {a.type}
                  </div>
                  <div style={{ color: T.textMuted }}>
                    {a.company} — {fmtDate(a.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
