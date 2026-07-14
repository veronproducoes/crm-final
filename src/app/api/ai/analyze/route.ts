import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeClientBrandFit } from "@/lib/ai";
import { permissions } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ clientId: z.string() });

// POST /api/ai/analyze
// A chamada à API da Anthropic acontece inteiramente aqui no servidor — a
// chave (ANTHROPIC_API_KEY) nunca é enviada ao navegador (briefing 3.7 e 5).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canRunAIAnalysis(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão para rodar a análise de IA." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  try {
    const result = await analyzeClientBrandFit({ company: client.company, city: client.city });

    const saved = await prisma.aIAnalysis.upsert({
      where: { clientId: client.id },
      update: { brandLabel: result.brandLabel, reasoning: result.reasoning, analyzedAt: new Date() },
      create: { clientId: client.id, brandLabel: result.brandLabel, reasoning: result.reasoning },
    });

    await logAudit({ userId: session.user.id, action: "ai_analyze", entity: "Client", entityId: client.id, metadata: result });

    return NextResponse.json(saved);
  } catch (err: any) {
    console.error("Erro na análise de IA:", err);
    return NextResponse.json({ error: "Falha na análise. Tente novamente." }, { status: 502 });
  }
}
