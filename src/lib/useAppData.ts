"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";
import { permissions, type Role } from "@/lib/permissions";
import { origins } from "@/lib/domain";
import type { UserLite } from "@/types";

export function useAppData() {
  const { data: session } = useSession();
  const { data: teamMembers } = useSWR<UserLite[]>("/api/users", fetcher);
  const role = (session?.user?.role as Role) || "COMERCIAL";

  return {
    session,
    role,
    teamMembers: teamMembers || [],
    origins,
    perms: {
      canEditClients: permissions.canEditClients(role),
      canDeleteClients: permissions.canDeleteClients(role),
      canMoveKanban: permissions.canMoveKanban(role),
      canManageColumns: permissions.canManageColumns(role),
      canToggleSubscriptions: permissions.canToggleSubscriptions(role),
      canRunAIAnalysis: permissions.canRunAIAnalysis(role),
    },
  };
}
