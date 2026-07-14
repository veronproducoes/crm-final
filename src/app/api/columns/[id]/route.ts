import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canManageColumns(session.user.role)) {
    return NextResponse.json({ error: "Apenas Administradores podem gerenciar colunas." }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, any> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.color !== undefined) data.color = body.color;
  if (body.position !== undefined) data.position = body.position;

  const column = await prisma.kanbanColumn.update({ where: { id: params.id }, data });
  await logAudit({ userId: session.user.id, action: "update", entity: "KanbanColumn", entityId: column.id, metadata: data });

  return NextResponse.json(column);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canManageColumns(session.user.role)) {
    return NextResponse.json({ error: "Apenas Administradores podem gerenciar colunas." }, { status: 403 });
  }

  const clientsInColumn = await prisma.client.count({ where: { columnId: params.id } });
  if (clientsInColumn > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: ${clientsInColumn} cliente(s) ainda estão nesta coluna. Mova-os antes de excluir.` },
      { status: 409 }
    );
  }

  await prisma.kanbanColumn.delete({ where: { id: params.id } });
  await logAudit({ userId: session.user.id, action: "delete", entity: "KanbanColumn", entityId: params.id });

  return NextResponse.json({ ok: true });
}
