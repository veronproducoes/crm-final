import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  secret: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const defaultColumns = [
  { id: "leads", name: "Leads", color: "#8B8FA8", position: 0 },
  { id: "primeiro_contato", name: "Primeiro Contato", color: "#4C6EF5", position: 1 },
  { id: "negociacao", name: "Em Negociação", color: "#F5A623", position: 2 },
  { id: "proposta", name: "Proposta Enviada", color: "#0F9D8B", position: 3 },
  { id: "aguardando", name: "Aguardando Retorno", color: "#9C6ADE", position: 4 },
  { id: "fechado", name: "Cliente Fechado", color: "#12B76A", position: 5 },
  { id: "perdido", name: "Perdido", color: "#E5484D", position: 6 },
];

// POST /api/setup
// Rota de configuração inicial (uso único). Só funciona enquanto NÃO existir
// nenhum usuário no banco — depois do primeiro admin criado, ela sempre
// retorna 403, então não fica um jeito de burlar login em produção.
// Requer a variável de ambiente SETUP_SECRET, definida por quem está fazendo o deploy.
export async function POST(req: NextRequest) {
  if (!process.env.SETUP_SECRET) {
    return NextResponse.json(
      { error: "SETUP_SECRET não configurada nas variáveis de ambiente do projeto." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Código de configuração incorreto." }, { status: 403 });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.json(
      { error: "Configuração inicial já foi concluída. Peça a um Administrador para criar seu usuário em Configurações." },
      { status: 403 }
    );
  }

  // Cria as colunas padrão do kanban, se ainda não existirem
  for (const col of defaultColumns) {
    await prisma.kanbanColumn.upsert({ where: { id: col.id }, update: {}, create: col });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: "ADMIN",
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, user });
}

// GET /api/setup — usado pela página /setup para saber se ainda precisa mostrar o formulário
export async function GET() {
  const existingUsers = await prisma.user.count();
  return NextResponse.json({ needsSetup: existingUsers === 0 });
}
