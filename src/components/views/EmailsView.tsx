"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher, apiRequest } from "@/lib/fetcher";
import { Avatar } from "@/components/ui/Avatar";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Search } from "lucide-react";
import { brands } from "@/lib/domain";
import type { ClientDto } from "@/types";

export function EmailsView({ canToggle }: { canToggle: boolean }) {
  const T = useTheme();
  const [search, setSearch] = useState("");
  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);

  if (!clients) {
    return <div className="p-6 text-sm" style={{ color: T.textMuted }}>Carregando e-mails...</div>;
  }

  const withEmail = clients.filter((c) => !!c.email && c.email.toLowerCase().includes(search.toLowerCase()));

  async function toggle(clientId: string, brand: "VERON" | "ARENA360", subscribed: boolean) {
    await apiRequest("/api/subscriptions", "PATCH", { clientId, brand, subscribed });
    mutate("/api/clients");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
        E-mails
      </h1>
      <p className="text-sm mb-5" style={{ color: T.textMuted }}>
        Cada contato tem assinatura independente por marca — desativar a Veron não afeta a Arena 360, e vice-versa.
      </p>

      <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 max-w-md" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <Search size={15} color={T.textMuted} />
        <input
          placeholder="Buscar por e-mail..."
          className="flex-1 text-sm outline-none"
          style={{ background: "transparent", color: T.text }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <table className="w-full text-base">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.line}` }}>
              {["Contato", "Empresa", "E-mail", "Veron", "Arena 360"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-xs" style={{ color: T.textMuted }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {withEmail.map((c) => {
              const veron = c.subscriptions.find((s) => s.brand === "VERON")?.subscribed ?? true;
              const arena = c.subscriptions.find((s) => s.brand === "ARENA360")?.subscribed ?? true;
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.contactName} size={26} />
                      <span style={{ color: T.text }}>{c.contactName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: T.textMuted }}>
                    {c.company}
                  </td>
                  <td className="px-4 py-3" style={{ color: T.text }}>
                    {c.email}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch on={veron} onClick={() => canToggle && toggle(c.id, "VERON", !veron)} color={brands[0].color} />
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch on={arena} onClick={() => canToggle && toggle(c.id, "ARENA360", !arena)} color={brands[1].color} />
                  </td>
                </tr>
              );
            })}
            {withEmail.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm" style={{ color: T.textMuted }}>
                  Nenhum contato encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
