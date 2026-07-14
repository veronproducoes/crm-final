"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher } from "@/lib/fetcher";
import { Avatar, brandRingStyle } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { BrandFilter } from "@/components/kanban/BrandFilter";
import { AddLeadModal } from "@/components/modals/AddLeadModal";
import { ClientModal } from "@/components/modals/ClientModal";
import { Search, Plus } from "lucide-react";
import { brandByDbValue, fmtDate } from "@/lib/domain";
import type { ClientDto, KanbanColumnDto, UserLite } from "@/types";

export function ClientsView({
  canCreate,
  canEditClient,
  canDeleteClient,
  teamMembers,
  origins,
}: {
  canCreate: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;
  teamMembers: UserLite[];
  origins: string[];
}) {
  const T = useTheme();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [respFilter, setRespFilter] = useState("Todos");
  const [brandFilter, setBrandFilter] = useState("todas");
  const [showAdd, setShowAdd] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);
  const { data: columns } = useSWR<KanbanColumnDto[]>("/api/columns", fetcher);

  if (!clients || !columns) {
    return <div className="p-6 text-sm" style={{ color: T.textMuted }}>Carregando empresas...</div>;
  }

  const cities = ["Todas", ...Array.from(new Set(clients.map((c) => c.city).filter(Boolean) as string[]))];
  const resps = ["Todos", ...teamMembers.map((m) => m.name)];

  const filtered = clients.filter((c) => {
    const matchesSearch = (c.company + c.contactName + (c.email || "")).toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === "Todas" || c.city === cityFilter;
    const matchesResp = respFilter === "Todos" || c.responsible?.name === respFilter;
    const matchesBrand = brandFilter === "todas" || c.brands.includes(brandFilter.toUpperCase() as any);
    return matchesSearch && matchesCity && matchesResp && matchesBrand;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          Cadastro de empresas
        </h1>
        {canCreate && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: T.brand }}>
            <Plus size={15} /> Novo lead
          </button>
        )}
      </div>
      <p className="text-sm mb-5" style={{ color: T.textMuted }}>
        {filtered.length} de {clients.length} clientes
      </p>

      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <Search size={15} color={T.textMuted} />
          <input
            placeholder="Buscar por nome, contato ou e-mail..."
            className="flex-1 text-sm outline-none"
            style={{ background: "transparent", color: T.text }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <BrandFilter value={brandFilter} onChange={setBrandFilter} />
        <select className="text-sm rounded-lg px-3" style={{ border: `1px solid ${T.line}`, background: T.surface, color: T.text }} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="text-sm rounded-lg px-3" style={{ border: `1px solid ${T.line}`, background: T.surface, color: T.text }} value={respFilter} onChange={(e) => setRespFilter(e.target.value)}>
          {resps.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <table className="w-full text-base">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.line}` }}>
              {["Empresa", "Contato", "Marca", "Cidade", "Responsável", "Etapa", "Cadastro"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.textMuted }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const col = columns.find((k) => k.id === c.columnId);
              const cBrands = c.brands.map(brandByDbValue).filter(Boolean) as NonNullable<ReturnType<typeof brandByDbValue>>[];
              return (
                <tr key={c.id} className="cursor-pointer hover:opacity-80" style={{ borderBottom: `1px solid ${T.line}` }} onClick={() => setOpenClientId(c.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.company} src={c.logoUrl} size={28} ringStyle={brandRingStyle(c.brands, T)} />
                      <span className="font-medium" style={{ color: T.text }}>
                        {c.company}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: T.textMuted }}>
                    {c.contactName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {cBrands.map((b) => (
                        <Pill key={b.id} color={b.color}>
                          {b.name}
                        </Pill>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: T.textMuted }}>
                    {c.city}
                  </td>
                  <td className="px-4 py-3" style={{ color: T.textMuted }}>
                    {c.responsible?.name}
                  </td>
                  <td className="px-4 py-3">{col && <Pill color={col.color}>{col.name}</Pill>}</td>
                  <td className="px-4 py-3" style={{ color: T.textMuted }}>
                    {fmtDate(c.createdAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-sm" style={{ color: T.textMuted }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} teamMembers={teamMembers} origins={origins} />}
      {openClientId && (
        <ClientModal
          clientId={openClientId}
          onClose={() => setOpenClientId(null)}
          canEdit={canEditClient}
          canDelete={canDeleteClient}
          teamMembers={teamMembers}
          origins={origins}
          columns={columns}
        />
      )}
    </div>
  );
}
