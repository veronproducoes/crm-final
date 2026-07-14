"use client";

import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher, apiRequest } from "@/lib/fetcher";
import { Avatar, brandRingStyle } from "@/components/ui/Avatar";
import { EditField } from "@/components/ui/EditField";
import { Pill } from "@/components/ui/Pill";
import {
  X,
  Pencil,
  Building2,
  Users,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  MapPinned,
  Clock,
  Check,
  Trash2,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";
import { brands, activityTypeOptions, activityTypeLabels, historyTypeColor, fmtDate } from "@/lib/domain";
import type { ClientDto, UserLite } from "@/types";

export function ClientModal({
  clientId,
  onClose,
  canEdit,
  canDelete,
  teamMembers,
  origins,
  columns,
}: {
  clientId: string;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  teamMembers: UserLite[];
  origins: string[];
  columns: { id: string; name: string }[];
}) {
  const T = useTheme();
  const [tab, setTab] = useState<"info" | "history" | "files">("info");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("OBSERVACAO");
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: client, isLoading } = useSWR<ClientDto>(`/api/clients/${clientId}`, fetcher);
  const { data: files } = useSWR<any[]>(`/api/clients/${clientId}/files`, fetcher);

  if (isLoading || !client) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: T.overlay }}>
        <div className="rounded-2xl px-6 py-4 text-sm" style={{ background: T.surface, color: T.textMuted }}>
          Carregando cliente...
        </div>
      </div>
    );
  }

  async function refresh() {
    await mutate(`/api/clients/${clientId}`);
    await mutate("/api/clients");
  }

  async function updateField(patch: Record<string, any>) {
    await apiRequest(`/api/clients/${clientId}`, "PATCH", patch);
    refresh();
  }

  function toggleBrand(brandId: string) {
    const dbValue = brandId === "veron" ? "VERON" : "ARENA360";
    const current = client!.brands || [];
    const next = current.includes(dbValue as any)
      ? current.filter((b) => b !== dbValue)
      : [...current, dbValue as any];
    updateField({ brands: next });
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/clients/${clientId}/logo`, { method: "POST", body: form });
    e.target.value = "";
    refresh();
  }

  async function removeLogo() {
    await fetch(`/api/clients/${clientId}/logo`, { method: "DELETE" });
    refresh();
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const res = await apiRequest(`/api/clients/${clientId}/history`, "POST", { type: noteType, text: noteText.trim() });
    setNoteText("");
    if (res.movedToPerdido) {
      await mutate("/api/clients");
    }
    refresh();
  }

  async function handleDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/clients/${clientId}/files`, { method: "POST", body: form });
    e.target.value = "";
    setUploading(false);
    mutate(`/api/clients/${clientId}/files`);
  }

  async function deleteClient() {
    if (!confirm(`Excluir o cliente "${client.company}"? Essa ação não pode ser desfeita.`)) return;
    await apiRequest(`/api/clients/${clientId}`, "DELETE");
    await mutate("/api/clients");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: T.overlay }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ background: T.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5" style={{ borderBottom: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar name={client.company} src={client.logoUrl} size={46} ringStyle={brandRingStyle(client.brands, T)} />
              {canEdit && (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  title="Alterar logo"
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: T.brand, border: `2px solid ${T.surface}` }}
                >
                  <Pencil size={9} color="white" />
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: "none" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                {client.company}
              </div>
              <div className="text-sm" style={{ color: T.textMuted }}>
                {client.contactName}
              </div>
              {client.logoUrl && canEdit && (
                <button onClick={removeLogo} className="text-xs mt-0.5" style={{ color: "#E5484D" }}>
                  Remover logo
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70">
            <X size={18} color={T.textMuted} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3" style={{ borderBottom: `1px solid ${T.line}` }}>
          {[
            ["info", "Dados"],
            ["history", "Histórico"],
            ["files", "Arquivos"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className="px-3 py-2 text-sm font-medium rounded-t-lg -mb-px"
              style={{
                color: tab === id ? T.brand : T.textMuted,
                borderBottom: tab === id ? `2px solid ${T.brand}` : "2px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === "info" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1" style={{ color: T.textMuted }}>
                  Marca(s) — este cliente pode atender mais de uma empresa
                </label>
                <div className="flex gap-2 flex-wrap">
                  {brands.map((b) => {
                    const active = (client.brands || []).includes(b.dbValue as any);
                    return (
                      <button
                        key={b.id}
                        disabled={!canEdit}
                        onClick={() => toggleBrand(b.id)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-60"
                        style={{
                          background: active ? b.color + "18" : T.surfaceAlt,
                          color: active ? b.color : T.textMuted,
                          border: `1px solid ${active ? b.color : T.line}`,
                        }}
                      >
                        {active && <Check size={12} />}
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <EditField icon={Building2} label="Empresa" value={client.company} onChange={(v) => updateField({ company: v })} />
              <EditField icon={Users} label="Contato" value={client.contactName} onChange={(v) => updateField({ contactName: v })} />
              <EditField icon={Phone} label="Telefone" value={client.phone || ""} onChange={(v) => updateField({ phone: v })} />
              <EditField icon={MessageCircle} label="WhatsApp" value={client.whatsapp || ""} onChange={(v) => updateField({ whatsapp: v })} />
              <EditField icon={Mail} label="E-mail" value={client.email || ""} onChange={(v) => updateField({ email: v })} />
              <EditField icon={MapPin} label="Cidade" value={client.city || ""} onChange={(v) => updateField({ city: v })} />
              <EditField icon={MapPinned} label="Endereço" value={client.address || ""} onChange={(v) => updateField({ address: v })} span2 />

              <div>
                <label className="text-xs font-medium flex items-center gap-2 mb-1" style={{ color: T.textMuted }}>
                  <Users size={14} />
                  Responsável
                </label>
                <select
                  disabled={!canEdit}
                  className="w-full text-sm rounded-lg px-2 py-1.5 outline-none disabled:opacity-60"
                  style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text }}
                  value={client.responsibleId || ""}
                  onChange={(e) => updateField({ responsibleId: e.target.value })}
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium flex items-center gap-2 mb-1" style={{ color: T.textMuted }}>
                  <Building2 size={14} />
                  Origem
                </label>
                <select
                  disabled={!canEdit}
                  className="w-full text-sm rounded-lg px-2 py-1.5 outline-none disabled:opacity-60"
                  style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text }}
                  value={client.origin || ""}
                  onChange={(e) => updateField({ origin: e.target.value })}
                >
                  {origins.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} color={T.textMuted} />
                <span style={{ color: T.text }}>Cadastrado em {fmtDate(client.createdAt)}</span>
              </div>

              <div className="col-span-2 pt-2">
                <label className="text-xs font-medium block mb-1" style={{ color: T.textMuted }}>
                  Etapa
                </label>
                <div className="text-sm font-medium" style={{ color: T.brand }}>
                  {columns.find((c) => c.id === client.columnId)?.name}
                </div>
              </div>
              {canDelete && (
                <div className="col-span-2 pt-2 flex justify-end">
                  <button
                    onClick={deleteClient}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: "#E5484D", background: "#E5484D14" }}
                  >
                    <Trash2 size={13} /> Excluir cliente
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "history" && (
            <div>
              {canEdit && (
                <>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="text-xs rounded-lg px-2 py-2"
                      style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text }}
                    >
                      {activityTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addNote()}
                      placeholder="Registrar uma atividade..."
                      className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                      style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text }}
                    />
                    <button onClick={addNote} className="text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: T.brand }}>
                      Adicionar
                    </button>
                  </div>
                  {noteType === "DESCARTADO" && (
                    <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "#E5484D" }}>
                      <AlertCircle size={13} /> Ao adicionar, o card será movido automaticamente para a coluna "Perdido"
                    </div>
                  )}
                </>
              )}
              <div className="space-y-3">
                {client.activities.length === 0 && (
                  <div className="text-sm text-center py-8" style={{ color: T.textMuted }}>
                    Nenhum registro ainda.
                  </div>
                )}
                {client.activities.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <Avatar name={h.user?.name || "?"} size={28} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs mb-0.5">
                        <Pill color={historyTypeColor(h.type)}>{activityTypeLabels[h.type]}</Pill>
                        <span style={{ color: T.textMuted }}>
                          {h.user?.name || "—"} · {fmtDate(h.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: T.text }}>
                        {h.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "files" && (
            <div>
              {canEdit && (
                <div className="mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-60"
                    style={{ background: T.brand }}
                  >
                    <Upload size={13} /> {uploading ? "Enviando..." : "Enviar arquivo (contrato, proposta, PDF...)"}
                  </button>
                  <input ref={fileInputRef} type="file" onChange={handleDocFile} style={{ display: "none" }} />
                </div>
              )}
              <div className="space-y-2">
                {(!files || files.length === 0) && (
                  <div className="text-sm text-center py-8" style={{ color: T.textMuted }}>
                    Nenhum arquivo enviado ainda.
                  </div>
                )}
                {files?.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:opacity-80"
                    style={{ border: `1px solid ${T.line}` }}
                  >
                    <FileText size={16} color={T.textMuted} />
                    <span className="text-sm flex-1 truncate" style={{ color: T.text }}>
                      {f.filename}
                    </span>
                    <span className="text-xs" style={{ color: T.textMuted }}>
                      {fmtDate(f.uploadedAt)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
