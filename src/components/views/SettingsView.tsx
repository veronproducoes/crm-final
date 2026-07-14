"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher, apiRequest } from "@/lib/fetcher";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { UserPlus } from "lucide-react";
import { roleLabels } from "@/lib/domain";

const roleColors: Record<string, string> = { ADMIN: "#E5484D", COMERCIAL: "#4C6EF5", FINANCEIRO: "#12B76A" };

export function SettingsView() {
  const T = useTheme();
  const { data: users } = useSWR<any[]>("/api/users", fetcher);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "COMERCIAL" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function createUser() {
    setError("");
    if (!form.name || !form.email || form.password.length < 6) {
      setError("Preencha nome, e-mail e uma senha com ao menos 6 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/api/users", "POST", form);
      setForm({ name: "", email: "", password: "", role: "COMERCIAL" });
      mutate("/api/users");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full text-sm rounded-lg px-3 py-2 outline-none";
  const inputStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
        Configurações
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMuted }}>
        Gestão de usuários e perfis de acesso. Colunas do Kanban (nome, cor, ordem) são gerenciadas diretamente na tela de Leads.
      </p>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl overflow-hidden shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: `1px solid ${T.line}`, color: T.text }}>
            Equipe
          </div>
          <table className="w-full text-base">
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${T.line}` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size={28} />
                      <div>
                        <div style={{ color: T.text }}>{u.name}</div>
                        <div className="text-xs" style={{ color: T.textMuted }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Pill color={roleColors[u.role]}>{roleLabels[u.role]}</Pill>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: u.active ? "#12B76A" : T.textMuted }}>
                    {u.active ? "Ativo" : "Inativo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl p-5 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
            <UserPlus size={16} /> Novo usuário
          </div>
          {error && (
            <div className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: "#E5484D14", color: "#E5484D" }}>
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <input className={inputCls} style={inputStyle} placeholder="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className={inputCls} style={inputStyle} placeholder="E-mail" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="Senha (mín. 6 caracteres)"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <select className={inputCls} style={inputStyle} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="ADMIN">Administrador (acesso total)</option>
              <option value="COMERCIAL">Comercial (Clientes, Kanban, Histórico, Agenda)</option>
              <option value="FINANCEIRO">Financeiro (consulta e exportações)</option>
            </select>
            <button onClick={createUser} disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60" style={{ background: T.brand }}>
              {saving ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
