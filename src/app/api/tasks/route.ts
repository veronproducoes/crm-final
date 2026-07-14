import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const tasks = await prisma.task.findMany({
    where: {
      clientId: clientId || undefined,
      status: (status as any) || undefined,
    },
    include: { client: { select: { id: true, company: true } }, responsible: { select: { id: true, name: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  responsibleId: z.string().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]).default("PENDENTE"),
  clientId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      responsibleId: parsed.data.responsibleId || session.user.id,
    },
  });

  await logAudit({ userId: session.user.id, action: "create", entity: "Task", entityId: task.id, metadata: { title: task.title } });

  return NextResponse.json(task, { status: 201 });
}
