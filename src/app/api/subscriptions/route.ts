import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  clientId: z.string(),
  brand: z.enum(["VERON", "ARENA360"]),
  subscribed: z.boolean(),
});

// PATCH /api/subscriptions
// Regra central do projeto (briefing 3.5): desativar a assinatura de uma
// marca para um contato NUNCA afeta a assinatura da outra marca — cada
// EmailSubscription é uma linha independente por (clientId, brand).
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!permissions.canToggleSubscriptions(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão para alterar assinaturas." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const sub = await prisma.emailSubscription.upsert({
    where: { clientId_brand: { clientId: parsed.data.clientId, brand: parsed.data.brand } },
    update: { subscribed: parsed.data.subscribed },
    create: { clientId: parsed.data.clientId, brand: parsed.data.brand, subscribed: parsed.data.subscribed },
  });

  await logAudit({
    userId: session.user.id,
    action: "toggle_subscription",
    entity: "EmailSubscription",
    entityId: sub.id,
    metadata: parsed.data,
  });

  return NextResponse.json(sub);
}
