import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { permissions } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      responsible: { select: { id: true, name: true } },
      column: true,
      subscriptions: true,
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      files: true,
      aiAnalysis: true,
    },
  });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json(client);
}

// PATCH /api/clients/[id]
// Suporta edição inline de campos (aba "Dados"), toggle de favorito, e
// movimentação no Kanban: { columnId, beforePosition } para reordenar dentro
// ou entre colunas.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const role = session.user.role;

  if (body.columnId !== undefined) {
    if (!permissions.canMoveKanban(role)) {
      return NextResponse.json({ error: "Sem permissão para mover cards no Kanban." }, { status: 403 });
    }
  } else if (!permissions.canEditClients(role)) {
    return NextResponse.json({ error: "Sem permissão para editar clientes." }, { status: 403 });
  }

  const allowedFields = [
    "company",
    "contactName",
    "phone",
    "whatsapp",
    "email",
    "address",
    "city",
    "brands",
    "origin",
    "responsibleId",
    "favorite",
    "logoUrl",
    "columnId",
    "position",
  ];

  const data: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  // Reordenação: se vier beforeClientId, recalcula a posição entre vizinhos
  if (body.beforeClientId !== undefined) {
    const targetColumnId = body.columnId || (await prisma.client.findUnique({ where: { id: params.id } }))?.columnId;
    const siblings = await prisma.client.findMany({
      where: { columnId: targetColumnId, NOT: { id: params.id } },
      orderBy: { position: "asc" },
    });
    if (body.beforeClientId === null) {
      data.position = (siblings.at(-1)?.position ?? 0) + 1;
    } else {
      const idx = siblings.findIndex((s) => s.id === body.beforeClientId);
      const prevPos = idx > 0 ? siblings[idx - 1].position : 0;
      const nextPos = idx !== -1 ? siblings[idx].position : prevPos + 1;
      data.position = (prevPos + nextPos) / 2;
    }
  }

  const updated = await prisma.client.update({
    where: { id: params.id },
    data,
    include: { subscriptions: true, activities: true, column: true, responsible: true },
  });

  await logAudit({
    userId: session.user.id,
    action: body.columnId ? "move_stage" : "update",
    entity: "Client",
    entityId: updated.id,
    metadata: data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canDeleteClients(session.user.role)) {
    return NextResponse.json({ error: "Apenas Administradores podem excluir clientes." }, { status: 403 });
  }

  await prisma.client.delete({ where: { id: params.id } });
  await logAudit({ userId: session.user.id, action: "delete", entity: "Client", entityId: params.id });

  return NextResponse.json({ ok: true });
}
