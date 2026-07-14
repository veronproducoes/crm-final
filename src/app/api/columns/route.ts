import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { colorFor } from "@/lib/domain";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const columns = await prisma.kanbanColumn.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json(columns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canManageColumns(session.user.role)) {
    return NextResponse.json({ error: "Apenas Administradores podem gerenciar colunas." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name || "Nova coluna";
  const last = await prisma.kanbanColumn.findFirst({ orderBy: { position: "desc" } });

  const column = await prisma.kanbanColumn.create({
    data: {
      name,
      color: body.color || colorFor(name + Date.now()),
      position: (last?.position ?? -1) + 1,
    },
  });

  await logAudit({ userId: session.user.id, action: "create", entity: "KanbanColumn", entityId: column.id, metadata: { name } });

  return NextResponse.json(column, { status: 201 });
}
