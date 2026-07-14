"use client";
import { ClientsView } from "@/components/views/ClientsView";
import { useAppData } from "@/lib/useAppData";

export default function Page() {
  const { perms, teamMembers, origins } = useAppData();
  return (
    <ClientsView
      canCreate={perms.canEditClients}
      canEditClient={perms.canEditClients}
      canDeleteClient={perms.canDeleteClients}
      teamMembers={teamMembers}
      origins={origins}
    />
  );
}
