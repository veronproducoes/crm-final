"use client";
import { EmailsView } from "@/components/views/EmailsView";
import { useAppData } from "@/lib/useAppData";

export default function Page() {
  const { perms } = useAppData();
  return <EmailsView canToggle={perms.canToggleSubscriptions} />;
}
