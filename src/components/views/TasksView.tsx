"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher, apiRequest } from "@/lib/fetcher";
import { Pill } from "@/components/ui/Pill";
import { Plus } from "lucide-react";
import { fmtDate } from "@/lib/domain";
import type { ClientDto, TaskDto, UserLite } from "@/types";

const statusLabels: Record<string, string> = { PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída" };
const statusColors: Record<string, string> = { PENDENTE: "#8B8FA8", EM_ANDAMENTO: "#F5A623", CONCLUIDA: "#12B76A" };
const priorityColors: Record<string, string> = { BAIXA: "#8B8FA8", MEDIA: "#4C6EF5", ALTA: "#E5484D" };
const priorityLabels: Record<string, string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" };

export function TasksView({ teamMembers, clients }: { teamMembers: UserLite[]; clients: ClientDto[] }) {
  const T = useTheme();
  const { data: tasks } = useSWR<TaskDto[]>("/api/tasks", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: "", priority: "MEDIA", responsibleId: teamMembers[0]?.id || "", clientId: "" });

  async function createTask() {
    if (!form.title.trim()) return;
    await apiRequest("/api/tasks", "POST", {
      title: form.title,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      priority: form.priority,
      responsibleId: form.responsibleId || undefined,
      clientId: form.clientId || undefined,
    });
    setForm({ title: "", dueDate: "", priority: "MEDIA", responsibleId: teamMembers[0]?.id || "", clientId: "" });
    setShowForm(false);
    mutate("/api/tasks");
  }

  async function setStatus(id: string, status: string) {
    await apiRequest(`/api/tasks/${id}`, "PATCH", { status });
    mutate("/api/tasks");
  }

  const inputCls = "w-full text-sm rounded-lg px-3 py-2 outline-none";
  const inputStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          Tarefas
        </h1>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: T.brand }}>
          <Plus size={15} /> Nova tarefa
        </button>
      </div>
      <p className="text-sm mb-5" style={{ color: T.textMuted }}>
        Tarefas vinculadas (ou não) a um cliente, com prioridade, responsável e prazo.
      </p>

      {showForm && (
        <div className="rounded-2xl p-4 mb-5 grid grid-cols-4 gap-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <input className={`${inputCls} col-span-2`} style={inputStyle} placeholder="Título da tarefa" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input className={inputCls} style={inputStyle} type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <select className={inputCls} style={inputStyle} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            <option value="BAIXA">Prioridade baixa</option>
            <option value="MEDIA">Prioridade média</option>
            <option value="ALTA">Prioridade alta</option>
          </select>
          <select className={inputCls} style={inputStyle} value={form.responsibleId} onChange={(e) => setForm((f) => ({ ...f, responsibleId: e.target.value }))}>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select className={inputCls} style={inputStyle} value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
            <option value="">Sem cliente vinculado</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>
          <button onClick={createTask} className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: T.brand }}>
            Salvar tarefa
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <table className="w-full text-base">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.line}` }}>
              {["Tarefa", "Cliente", "Responsável", "Prioridade", "Prazo", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.textMuted }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks?.map((t) => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${T.line}` }}>
                <td className="px-4 py-3" style={{ color: T.text }}>
                  {t.title}
                </td>
                <td className="px-4 py-3" style={{ color: T.textMuted }}>
                  {t.client?.company || "—"}
                </td>
                <td className="px-4 py-3" style={{ color: T.textMuted }}>
                  {t.responsible?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <Pill color={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Pill>
                </td>
                <td className="px-4 py-3" style={{ color: T.textMuted }}>
                  {t.dueDate ? fmtDate(t.dueDate) : "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={t.status}
                    onChange={(e) => setStatus(t.id, e.target.value)}
                    className="text-xs rounded-lg px-2 py-1"
                    style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt, color: statusColors[t.status] }}
                  >
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {tasks?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm" style={{ color: T.textMuted }}>
                  Nenhuma tarefa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
