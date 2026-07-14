"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { useTheme } from "@/lib/theme";
import { fetcher } from "@/lib/fetcher";
import { Pill } from "@/components/ui/Pill";
import { CalendarDays } from "lucide-react";
import type { TaskDto } from "@/types";

const priorityColors: Record<string, string> = { BAIXA: "#8B8FA8", MEDIA: "#4C6EF5", ALTA: "#E5484D" };

export function AgendaView() {
  const T = useTheme();
  const { data: tasks } = useSWR<TaskDto[]>("/api/tasks", fetcher);

  const groups = useMemo(() => {
    if (!tasks) return [];
    const withDate = tasks.filter((t) => t.dueDate);
    const byDate = new Map<string, TaskDto[]>();
    withDate.forEach((t) => {
      const key = new Date(t.dueDate!).toLocaleDateString("pt-BR");
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(t);
    });
    return Array.from(byDate.entries()).sort(
      (a, b) => new Date(a[1][0].dueDate!).getTime() - new Date(b[1][0].dueDate!).getTime()
    );
  }, [tasks]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
        <CalendarDays size={20} color={T.brand} /> Agenda
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMuted }}>
        Reúne tarefas com prazo definido. Ligações, reuniões e visitas aparecem aqui quando registradas como tarefas vinculadas ao cliente.
      </p>

      <div className="space-y-4">
        {groups.length === 0 && (
          <div className="text-sm rounded-2xl p-6 text-center" style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.textMuted }}>
            Nenhum compromisso com prazo definido. Crie tarefas com data em "Tarefas".
          </div>
        )}
        {groups.map(([date, items]) => (
          <div key={date} className="rounded-2xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="text-sm font-semibold mb-3" style={{ color: T.text }}>
              {date}
            </div>
            <div className="space-y-2">
              {items.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg" style={{ background: T.surfaceAlt }}>
                  <div style={{ color: T.text }}>
                    {t.title} {t.client && <span style={{ color: T.textMuted }}>— {t.client.company}</span>}
                  </div>
                  <Pill color={priorityColors[t.priority]}>{t.responsible?.name || "Sem responsável"}</Pill>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
