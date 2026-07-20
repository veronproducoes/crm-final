"use client";

import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { fetcher, apiRequest } from "@/lib/fetcher";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { BrandFilter } from "@/components/kanban/BrandFilter";
import { SortToggle } from "@/components/kanban/SortToggle";
import { ClientModal } from "@/components/modals/ClientModal";
import { colorFor } from "@/lib/domain";
import { Plus } from "lucide-react";
import type { ClientDto, KanbanColumnDto, UserLite } from "@/types";

export function KanbanView({
  canManageColumns,
  canMove,
  canEditClient,
  canDeleteClient,
  teamMembers,
  origins,
}: {
  canManageColumns: boolean;
  canMove: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;
  teamMembers: UserLite[];
  origins: string[];
}) {
  const T = useTheme();
  const dragId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [brandFilter, setBrandFilter] = useState("todas");
  const [sortLeadsAZ, setSortLeadsAZ] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);
  const { data: columns } = useSWR<KanbanColumnDto[]>("/api/columns", fetcher);

  if (!clients || !columns) {
    return <div className="p-6 text-sm" style={{ color: T.textMuted }}>Carregando kanban...</div>;
  }

  const visible = brandFilter === "todas" ? clients : clients.filter((c) => c.brands.includes(brandFilter.toUpperCase() as any));

  function onDragStart(e: React.DragEvent, id: string) {
    dragId.current = id;
  }

  function handleAutoScroll(e: React.DragEvent) {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const edgeSize = 120;
    const maxSpeed = 22;
    const x = e.clientX;

    if (x < rect.left + edgeSize) {
      const intensity = Math.min(1, (rect.left + edgeSize - x) / edgeSize);
      el.scrollLeft -= maxSpeed * intensity;
    } else if (x > rect.right - edgeSize) {
      const intensity = Math.min(1, (x - (rect.right - edgeSize)) / edgeSize);
      el.scrollLeft += maxSpeed * intensity;
    }
  }

  async function moveClient(draggedId: string | null, columnId: string, beforeClientId: string | null) {
    if (!draggedId || draggedId === beforeClientId || !clients) return;
    const dragged = clients.find((c) => c.id === draggedId);
    if (!dragged) return;

    const siblings = clients
      .filter((c) => c.columnId === columnId && c.id !== draggedId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;
    if (beforeClientId === null) {
      newPosition = (siblings.at(-1)?.position ?? 0) + 1;
    } else {
      const idx = siblings.findIndex((s) => s.id === beforeClientId);
      const prevPos = idx > 0 ? siblings[idx - 1].position : 0;
      const nextPos = idx !== -1 ? siblings[idx].position : prevPos + 1;
      newPosition = (prevPos + nextPos) / 2;
    }

    const optimistic = clients.map((c) => (c.id === draggedId ? { ...c, columnId, position: newPosition } : c));
    mutate("/api/clients", optimistic, false);

    try {
      await apiRequest(`/api/clients/${draggedId}`, "PATCH", { columnId, beforeClientId });
      mutate("/api/clients");
    } catch (e) {
      mutate("/api/clients");
    }
  }

  function onDrop(e: React.DragEvent, colId: string) {
    moveClient(dragId.current, colId, null);
    dragId.current = null;
  }
  function onCardDrop(e: React.DragEvent, targetClient: ClientDto) {
    e.stopPropagation();
    moveClient(dragId.current, targetClient.columnId, targetClient.id);
    dragId.current = null;
  }

  async function toggleFav(id: string) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    const optimistic = clients.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x));
    mutate("/api/clients", optimistic, false);
    try {
      await apiRequest(`/api/clients/${id}`, "PATCH", { favorite: !c.favorite });
      mutate("/api/clients");
    } catch (e) {
      mutate("/api/clients");
    }
  }

  async function renameCol(id: string, name: string) {
    await apiRequest(`/api/columns/${id}`, "PATCH", { name });
    mutate("/api/columns");
  }

  async function deleteCol(id: string) {
    if (!confirm("Excluir esta coluna? Só é possível se ela estiver vazia.")) return;
    try {
      await apiRequest(`/api/columns/${id}`, "DELETE");
      mutate("/api/columns");
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function addCol() {
    const name = "Nova coluna";
    await apiRequest("/api/columns", "POST", { name, color: colorFor(name + Date.now()) });
    mutate("/api/columns");
  }

  return (
    <div ref={scrollRef} onDragOver={handleAutoScroll} className="p-6 overflow-x-auto h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            Leads
          </h1>
          <p className="text-base" style={{ color: T.textMuted }}>
            Arraste os cards entre as colunas ou para cima/baixo dentro da mesma coluna
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrandFilter value={brandFilter} onChange={setBrandFilter} />
          {canManageColumns && (
            <button onClick={addCol} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg text-white" style={{ background: T.brand }}>
              <Plus size={15} /> Nova coluna
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-4 items-start">
        {columns.map((col) => {
          const colClients = visible.filter((c) => c.columnId === col.id).sort((a, b) => a.position - b.position);
          const isLeads = col.id === "leads";
          const displayClients = isLeads && sortLeadsAZ ? [...colClients].sort((a, b) => a.company.localeCompare(b.company, "pt-BR")) : colClients;
          return (
            <KanbanColumn
              key={col.id}
              col={col}
              clients={displayClients}
              onOpen={(c) => setOpenClientId(c.id)}
              onDragStart={onDragStart}
              onDrop={canMove ? onDrop : () => {}}
              onCardDrop={canMove ? onCardDrop : () => {}}
              onToggleFav={toggleFav}
              onRename={renameCol}
              onDelete={deleteCol}
              canManageColumns={canManageColumns}
              extraHeaderControl={isLeads ? <SortToggle active={sortLeadsAZ} onClick={() => setSortLeadsAZ((s) => !s)} compact /> : null}
            />
          );
        })}
      </div>

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
