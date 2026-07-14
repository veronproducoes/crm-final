"use client";
import useSWR from "swr";
import { TasksView } from "@/components/views/TasksView";
import { useAppData } from "@/lib/useAppData";
import { fetcher } from "@/lib/fetcher";
import type { ClientDto } from "@/types";

export default function Page() {
  const { teamMembers } = useAppData();
  const { data: clients } = useSWR<ClientDto[]>("/api/clients", fetcher);
  return <TasksView teamMembers={teamMembers} clients={clients || []} />;
}
