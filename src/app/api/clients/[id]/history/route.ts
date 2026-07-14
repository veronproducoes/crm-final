import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["OBSERVACAO", "LIGACAO", "REUNIAO", "VISITA", "PROPOSTA", "PENDENCIA", "DESCARTADO"]),
  text: z.string().min(1),
});

// POST /api/clients/[id]/history
// Regra de negócio central (briefing 3.4): ao registrar "Descartado (sem
// interesse)", o card é movido automaticamente para a coluna "Perdido".
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const activity = await prisma.activity.create({
    data: {
      clientId: params.id,
      type: parsed.data.type,
      text: parsed.data.text,
      userId: session.user.id,
    },
  });

  let movedToPerdido = false;
  if (parsed.data.type === "DESCARTADO") {
    const perdidoColumn = await prisma.kanbanColumn.findFirst({ where: { id: "perdido" } });
    if (perdidoColumn) {
      await prisma.client.update({
        where: { id: params.id },
        data: { columnId: perdidoColumn.id },
      });
      movedToPerdido = true;
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "add_activity",
    entity: "Client",
    entityId: params.id,
    metadata: { type: parsed.data.type, movedToPerdido },
  });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      column: true,
      subscriptions: true,
      responsible: true,
    },
  });

  return NextResponse.json({ activity, movedToPerdido, client }, { status: 201 });
}
