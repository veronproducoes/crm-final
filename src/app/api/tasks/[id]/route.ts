import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const data: Record<string, any> = {};
  for (const key of ["title", "description", "dueDate", "responsibleId", "priority", "status", "clientId"]) {
    if (body[key] !== undefined) data[key] = key === "dueDate" ? new Date(body[key]) : body[key];
  }

  const task = await prisma.task.update({ where: { id: params.id }, data });
  await logAudit({ userId: session.user.id, action: "update", entity: "Task", entityId: task.id, metadata: data });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await prisma.task.delete({ where: { id: params.id } });
  await logAudit({ userId: session.user.id, action: "delete", entity: "Task", entityId: params.id });

  return NextResponse.json({ ok: true });
}
