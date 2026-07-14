import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET /api/reports/emails?report=todos_ativos|veron_ativos|veron_inativos|arena360_ativos|arena360_inativos&format=json|csv
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const report = searchParams.get("report") || "todos_ativos";
  const format = searchParams.get("format") || "json";

  const clients = await prisma.client.findMany({
    include: { subscriptions: true },
  });

  const subsOf = (c: (typeof clients)[number]) => ({
    veron: c.subscriptions.find((s) => s.brand === "VERON")?.subscribed ?? true,
    arena360: c.subscriptions.find((s) => s.brand === "ARENA360")?.subscribed ?? true,
  });

  let filtered = clients.filter((c) => {
    const s = subsOf(c);
    switch (report) {
      case "veron_ativos":
        return s.veron;
      case "veron_inativos":
        return !s.veron;
      case "arena360_ativos":
        return s.arena360;
      case "arena360_inativos":
        return !s.arena360;
      default:
        return s.veron || s.arena360;
    }
  });

  if (format === "csv") {
    // Regra do briefing (3.6): o CSV deste relatório contém APENAS a coluna de e-mails.
    const lines = [["E-mail"], ...filtered.map((c) => [c.email || ""])];
    const csv = lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

    await logAudit({ userId: session.user.id, action: "export_csv", entity: "EmailReport", metadata: { report, count: filtered.length } });

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-${report}.csv"`,
      },
    });
  }

  const payload = filtered.map((c) => ({
    id: c.id,
    contactName: c.contactName,
    company: c.company,
    email: c.email,
    city: c.city,
    subscriptions: subsOf(c),
  }));

  const counts = {
    veronActive: clients.filter((c) => subsOf(c).veron).length,
    veronInactive: clients.filter((c) => !subsOf(c).veron).length,
    arena360Active: clients.filter((c) => subsOf(c).arena360).length,
    arena360Inactive: clients.filter((c) => !subsOf(c).arena360).length,
  };

  return NextResponse.json({ items: payload, counts });
}
