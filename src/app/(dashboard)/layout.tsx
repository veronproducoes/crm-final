import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemedShell } from "@/components/layout/ThemedShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <ThemedShell>
      <Sidebar user={session.user} />
      <main className="flex-1 min-w-0">{children}</main>
    </ThemedShell>
  );
}
