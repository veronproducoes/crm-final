import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// GET /api/clients?search=&city=&responsibleId=&brand=veron|arena360|todas&stage=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city");
  const responsibleId = searchParams.get("responsibleId");
  const brand = searchParams.get("brand");
  const stage = searchParams.get("stage");

  const clients = await prisma.client.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { company: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        city && city !== "Todas" ? { city } : {},
        responsibleId && responsibleId !== "Todos" ? { responsibleId } : {},
        brand && brand !== "todas" ? { brands: { has: brand.toUpperCase() as any } } : {},
        stage ? { columnId: stage } : {},
      ],
    },
    include: {
      responsible: { select: { id: true, name: true } },
      column: true,
      subscriptions: true,
      activities: { orderBy: { createdAt: "desc" } },
      aiAnalysis: true,
    },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(clients);
}

const createClientSchema = z.object({
  company: z.string().min(1),
  contactName: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  brands: z.array(z.enum(["VERON", "ARENA360"])).default([]),
  origin: z.string().optional(),
  responsibleId: z.string().optional(),
  note: z.string().optional(),
});

// POST /api/clients — cria um novo lead (botão "Novo lead" fica na tela de Empresas)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const leadsColumn = await prisma.kanbanColumn.findFirst({ where: { id: "leads" } });
  if (!leadsColumn) {
    return NextResponse.json({ error: "Coluna 'Leads' não encontrada." }, { status: 500 });
  }

  const client = await prisma.client.create({
    data: {
      company: data.company,
      contactName: data.contactName,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      address: data.address,
      city: data.city,
      brands: data.brands as any,
      origin: data.origin,
      responsibleId: data.responsibleId || session.user.id,
      columnId: leadsColumn.id,
      subscriptions: {
        create: [
          { brand: "VERON", subscribed: true },
          { brand: "ARENA360", subscribed: true },
        ],
      },
      activities: data.note
        ? { create: [{ type: "OBSERVACAO", text: data.note, userId: session.user.id }] }
        : undefined,
    },
    include: { subscriptions: true, activities: true, column: true, responsible: true },
  });

  await logAudit({ userId: session.user.id, action: "create", entity: "Client", entityId: client.id, metadata: { company: client.company } });

  return NextResponse.json(client, { status: 201 });
}
