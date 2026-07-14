"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme, useDarkMode } from "@/lib/theme";
import { Avatar } from "@/components/ui/Avatar";
import {
  LayoutDashboard,
  KanbanSquare,
  Building2,
  Mail,
  BarChart3,
  Sparkles,
  Settings,
  CheckSquare,
  CalendarDays,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { roleLabels } from "@/lib/domain";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kanban", label: "Leads", icon: KanbanSquare },
  { href: "/clients", label: "Empresas", icon: Building2 },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/ai", label: "Análise por IA", icon: Sparkles },
  { href: "/tasks", label: "Tarefas", icon: CheckSquare },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];

export function Sidebar({ user }: { user: { name: string; email: string; role: string } }) {
  const T = useTheme();
  const { dark, setDark } = useDarkMode();
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0" style={{ background: T.surface, borderRight: `1px solid ${T.line}` }}>
      <div className="px-5 py-5 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: T.brand }}>
          V
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            CRM Veron
          </div>
          <div className="text-xs" style={{ color: T.textMuted }}>
            Veron &amp; Arena 360
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: active ? T.brand + "18" : "transparent", color: active ? T.brand : T.textMuted }}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
        {user.role === "ADMIN" && (
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: pathname?.startsWith("/settings") ? T.brand + "18" : "transparent", color: pathname?.startsWith("/settings") ? T.brand : T.textMuted }}
          >
            <Settings size={17} />
            Configurações
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 space-y-2" style={{ borderTop: `1px solid ${T.line}` }}>
        <button onClick={() => setDark((d) => !d)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ color: T.textMuted }}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          {dark ? "Modo claro" : "Modo escuro"}
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar name={user.name} size={30} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: T.text }}>
              {user.name}
            </div>
            <div className="text-xs truncate" style={{ color: T.textMuted }}>
              {roleLabels[user.role] || user.role}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: "#E5484D" }}
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
