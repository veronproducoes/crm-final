"use client";

import { useTheme } from "@/lib/theme";
import { Avatar, brandRingStyle } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { brandByDbValue, fmtDate } from "@/lib/domain";
import { Star, Phone, MapPin } from "lucide-react";
import type { ClientDto } from "@/types";

export function ClientCard({
  client,
  onOpen,
  onDragStart,
  onCardDrop,
  onToggleFav,
}: {
  client: ClientDto;
  onOpen: (c: ClientDto) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onCardDrop: (e: React.DragEvent, client: ClientDto) => void;
  onToggleFav: (id: string) => void;
}) {
  const T = useTheme();
  const clientBrands = (client.brands || []).map(brandByDbValue).filter(Boolean) as NonNullable<
    ReturnType<typeof brandByDbValue>
  >[];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, client.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onCardDrop(e, client)}
      onClick={() => onOpen(client)}
      className="rounded-xl p-4 mb-3 cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5"
      style={{ background: T.surface, border: `1px solid ${T.line}` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar name={client.company} src={client.logoUrl} size={34} ringStyle={brandRingStyle(client.brands, T)} />
          <div>
            <div className="text-base font-semibold leading-tight" style={{ color: T.text }}>
              {client.company}
            </div>
            <div className="text-sm" style={{ color: T.textMuted }}>
              {client.contactName}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(client.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star size={15} fill={client.favorite ? "#F5A623" : "none"} color={client.favorite ? "#F5A623" : T.textMuted} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {clientBrands.map((b) => (
          <Pill key={b.id} color={b.color}>
            {b.name}
          </Pill>
        ))}
      </div>
      {client.phone && (
        <div className="flex items-center gap-3 text-sm" style={{ color: T.textMuted }}>
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {client.phone}
          </span>
        </div>
      )}
      {client.city && (
        <div className="flex items-center gap-1 text-sm mt-1.5" style={{ color: T.textMuted }}>
          <MapPin size={12} />
          {client.city}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${T.line}` }}>
        <span className="text-xs" style={{ color: T.textMuted }}>
          {fmtDate(client.createdAt)}
        </span>
        {client.responsible && <Avatar name={client.responsible.name} size={22} />}
      </div>
    </div>
  );
}
