"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { ClientCard } from "./ClientCard";
import { Pencil, Trash2 } from "lucide-react";
import type { ClientDto, KanbanColumnDto } from "@/types";

export function KanbanColumn({
  col,
  clients,
  onOpen,
  onDragStart,
  onDrop,
  onCardDrop,
  onToggleFav,
  onRename,
  onDelete,
  canManageColumns,
  extraHeaderControl,
}: {
  col: KanbanColumnDto;
  clients: ClientDto[];
  onOpen: (c: ClientDto) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, colId: string) => void;
  onCardDrop: (e: React.DragEvent, client: ClientDto) => void;
  onToggleFav: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  canManageColumns: boolean;
  extraHeaderControl?: React.ReactNode;
}) {
  const T = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(col.name);

  return (
    <div
      className="flex flex-col shrink-0 w-80 rounded-2xl"
      style={{ background: dragOver ? T.canvas : "transparent" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, col.id);
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 mb-1 rounded-xl"
        style={{ borderTop: `3px solid ${col.color}`, background: T.surface }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                setEditing(false);
                onRename(col.id, name || col.name);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="text-base font-semibold px-1 rounded outline-none"
              style={{ color: T.text, border: `1px solid ${col.color}`, width: "100%", background: T.surface }}
            />
          ) : (
            <span
              className="text-base font-semibold truncate"
              style={{ color: T.text }}
              onDoubleClick={() => canManageColumns && setEditing(true)}
            >
              {col.name}
            </span>
          )}
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: col.color + "18", color: col.color }}
          >
            {clients.length}
          </span>
        </div>
        {canManageColumns && (
          <div className="flex items-center gap-1 shrink-0">
            {extraHeaderControl}
            <button onClick={() => setEditing(true)} title="Renomear coluna" className="p-1 rounded hover:opacity-70">
              <Pencil size={13} color={T.textMuted} />
            </button>
            <button onClick={() => onDelete(col.id)} title="Excluir coluna" className="p-1 rounded hover:opacity-70">
              <Trash2 size={13} color={T.textMuted} />
            </button>
          </div>
        )}
        {!canManageColumns && extraHeaderControl}
      </div>
      <div className="px-1 pb-2 min-h-[60px]">
        {clients.map((c) => (
          <ClientCard key={c.id} client={c} onOpen={onOpen} onDragStart={onDragStart} onCardDrop={onCardDrop} onToggleFav={onToggleFav} />
        ))}
        {clients.length === 0 && (
          <div className="text-sm text-center py-6 rounded-xl" style={{ color: T.textMuted, border: `1px dashed ${T.line}` }}>
            Arraste um card para cá
          </div>
        )}
      </div>
    </div>
  );
}
