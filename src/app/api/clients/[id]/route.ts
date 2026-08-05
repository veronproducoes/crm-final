import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import crypto from "crypto";

export const maxDuration = 60;

const rowSchema = z.object({
  company: z.string().min(1),
  contactName: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  origin: z.string().optional(),
  brands: z.array(z.enum(["VERON", "ARENA360"])).default([]),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canEditClients(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão para importar clientes." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const leadsColumn = await prisma.kanbanColumn.findFirst({ where: { id: "leads" } });
  if (!leadsColumn) {
    return NextResponse.json({ error: "Coluna 'Leads' não encontrada." }, { status: 500 });
  }

  const clientsData = parsed.data.rows.map((row) => ({
    id: crypto.randomUUID(),
    company: row.company,
    contactName: row.contactName,
    phone: row.phone || null,
    whatsapp: row.whatsapp || null,
    email: row.email || null,
    city: row.city || null,
    address: row.address || null,
    origin: row.origin || null,
    brands: row.brands as any,
    responsibleId: session.user.id,
    columnId: leadsColumn.id,
  }));

  const subscriptionsData = clientsData.flatMap((c) => [
    { id: crypto.randomUUID(), clientId: c.id, brand: "VERON" as const, subscribed: true },
    { id: crypto.randomUUID(), clientId: c.id, brand: "ARENA360" as const, subscribed: true },
  ]);

  let created = 0;
  try {
    const result = await prisma.client.createMany({ data: clientsData, skipDuplicates: true });
    created = result.count;
    await prisma.emailSubscription.createMany({ data: subscriptionsData, skipDuplicates: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Falha ao importar: ${e.message || "erro desconhecido"}` }, { status: 500 });
  }

  await logAudit({
    userId: session.user.id,
    action: "import_csv",
    entity: "Client",
    metadata: { created, total: clientsData.length },
  });

  return NextResponse.json({ created, errors: [] });
}
