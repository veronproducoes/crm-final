"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { fetcher } from "@/lib/fetcher";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { UserPlus, TrendingUp, CheckCircle2, X, Users, CheckSquare, AlertTriangle } from "lucide-react";
import { fmtDate } from "@/lib/domain";
import type { ClientDto, KanbanColumnDto, TaskDto } from "@/types";

const priorityColors: Record<string, string> = { BAIXA: "#8B8FA8", MEDIA: "#4C6EF5", ALTA: "#E5484D" };
const priorityLabels: Record<string, string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" };

export function DashboardView() {
  const T = useTheme();
  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);
  const { data: columns } = useSWR<KanbanColumnDto[]>("/api/columns", fetcher);
  const { data: tasks } = useSWR<TaskDto[]>("/api/tasks", fetcher);

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

  const pendingTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t) => t.status !== "CONCLUIDA")
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 6);
  }, [tasks]);

  function isOverdue(t: TaskDto) {
    return !!t.dueDate && new Date(t.dueDate).getTime() < Date.now();
  }

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

      <div className="grid grid-cols-3 gap-5 mb-5">
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

      <div className="rounded-2xl p-5 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: T.text }}>
          <CheckSquare size={16} color={T.brand} />
          Tarefas pendentes
        </div>
        {pendingTasks.length === 0 && (
          <div className="text-sm" style={{ color: T.textMuted }}>
            Nenhuma tarefa pendente. Crie tarefas na tela "Tarefas".
          </div>
        )}
        <div className="space-y-2">
          {pendingTasks.map((t) => {
            const overdue = isOverdue(t);
            return (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm px-3 py-2.5 rounded-lg"
                style={{ background: T.surfaceAlt, border: overdue ? "1px solid #E5484D55" : "none" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {overdue && <AlertTriangle size={14} color="#E5484D" />}
                  <span className="truncate" style={{ color: T.text }}>
                    {t.title}
                  </span>
                  {t.client && (
                    <span className="text-xs truncate" style={{ color: T.textMuted }}>
                      — {t.client.company}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs" style={{ color: overdue ? "#E5484D" : T.textMuted }}>
                    {t.dueDate ? fmtDate(t.dueDate) : "Sem prazo"}
                  </span>
                  <Pill color={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Pill>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
