"use client";
import { KanbanView } from "@/components/views/KanbanView";
import { useAppData } from "@/lib/useAppData";

export default function Page() {
  const { perms, teamMembers, origins } = useAppData();
  return (
    <KanbanView
      canManageColumns={perms.canManageColumns}
      canMove={perms.canMoveKanban}
      canEditClient={perms.canEditClients}
      canDeleteClient={perms.canDeleteClients}
      teamMembers={teamMembers}
      origins={origins}
    />
  );
}
