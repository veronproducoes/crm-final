import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

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
  rows: z.array(rowSchema).min(1).max(1000),
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

  let created = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const row = parsed.data.rows[i];
    try {
      await prisma.client.create({
        data: {
          company: row.company,
          contactName: row.contactName,
          phone: row.phone || undefined,
          whatsapp: row.whatsapp || undefined,
          email: row.email || undefined,
          city: row.city || undefined,
          address: row.address || undefined,
          origin: row.origin || undefined,
          brands: row.brands as any,
          responsibleId: session.user.id,
          columnId: leadsColumn.id,
          subscriptions: {
            create: [
              { brand: "VERON", subscribed: true },
              { brand: "ARENA360", subscribed: true },
            ],
          },
        },
      });
      created++;
    } catch (e: any) {
      errors.push({ row: i + 1, message: e.message || "Erro desconhecido" });
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "import_csv",
    entity: "Client",
    metadata: { created, errorCount: errors.length },
  });

  return NextResponse.json({ created, errors });
}
