"use client";

import { useRef, useState } from "react";
import { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/ui/Avatar";
import { FormField } from "@/components/ui/FormField";
import { UserPlus, X, Check } from "lucide-react";
import { brands } from "@/lib/domain";
import type { UserLite } from "@/types";

export function AddLeadModal({
  onClose,
  teamMembers,
  origins,
}: {
  onClose: () => void;
  teamMembers: UserLite[];
  origins: string[];
}) {
  const T = useTheme();
  const [form, setForm] = useState({
    contact: "",
    company: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
    address: "",
    origin: origins[0] || "",
    responsibleId: teamMembers[0]?.id || "",
    brand: ["VERON"] as string[],
    notes: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  function set(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleBrand(dbValue: string) {
    setForm((f) => ({
      ...f,
      brand: f.brand.includes(dbValue) ? f.brand.filter((b) => b !== dbValue) : [...f.brand, dbValue],
    }));
  }
  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function submit() {
    if (!form.contact.trim() || !form.company.trim()) {
      setError("Preencha ao menos Empresa e Contato.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company,
          contactName: form.contact,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          city: form.city,
          address: form.address,
          origin: form.origin,
          responsibleId: form.responsibleId,
          brands: form.brand,
          note: form.notes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ? JSON.stringify(body.error) : "Erro ao criar lead.");
      }
      const created = await res.json();

      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append("file", logoFile);
        await fetch(`/api/clients/${created.id}/logo`, { method: "POST", body: logoForm });
      }

      await mutate("/api/clients");
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao criar lead.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full text-sm rounded-lg px-3 py-2 outline-none";
  const inputStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: T.overlay }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: T.surface }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2">
            <UserPlus size={18} color={T.brand} />
            <span className="text-base font-bold" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
              Novo lead
            </span>
          </div>
          <button onClick={onClose}>
            <X size={18} color={T.textMuted} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="col-span-2 text-xs rounded-lg px-3 py-2" style={{ background: "#E5484D14", color: "#E5484D" }}>
              {error}
            </div>
          )}
          <div className="col-span-2">
            <FormField label="Logo da empresa (opcional)">
              <div className="flex items-center gap-3">
                <Avatar name={form.company || "?"} src={logoPreview} size={44} />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ border: `1px solid ${T.line}`, color: T.text }}
                >
                  {logoPreview ? "Trocar imagem" : "Enviar imagem"}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="text-xs"
                    style={{ color: "#E5484D" }}
                  >
                    Remover
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: "none" }} />
              </div>
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Marca(s) — atende mais de uma empresa?">
              <div className="flex gap-2 flex-wrap">
                {brands.map((b) => {
                  const active = form.brand.includes(b.dbValue);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBrand(b.dbValue)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
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
            </FormField>
          </div>
          <FormField label="Nome do contato">
            <input className={inputCls} style={inputStyle} value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          </FormField>
          <FormField label="Empresa">
            <input className={inputCls} style={inputStyle} value={form.company} onChange={(e) => set("company", e.target.value)} />
          </FormField>
          <FormField label="Telefone">
            <input className={inputCls} style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </FormField>
          <FormField label="WhatsApp">
            <input className={inputCls} style={inputStyle} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </FormField>
          <FormField label="E-mail">
            <input className={inputCls} style={inputStyle} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </FormField>
          <FormField label="Cidade">
            <input className={inputCls} style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Endereço">
              <input
                className={inputCls}
                style={inputStyle}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Rua, número, bairro..."
              />
            </FormField>
          </div>
          <FormField label="Origem do lead">
            <select className={inputCls} style={inputStyle} value={form.origin} onChange={(e) => set("origin", e.target.value)}>
              {origins.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Responsável">
            <select className={inputCls} style={inputStyle} value={form.responsibleId} onChange={(e) => set("responsibleId", e.target.value)}>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="col-span-2">
            <FormField label="Observações">
              <textarea rows={2} className={inputCls} style={inputStyle} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </FormField>
          </div>
        </div>
        <div className="p-5 pt-0 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: T.textMuted }}>
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
            style={{ background: T.brand }}
          >
            {submitting ? "Cadastrando..." : "Cadastrar lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
