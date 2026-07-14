import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

// GET /api/clients/[id]/files — lista arquivos do cliente
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const files = await prisma.fileAsset.findMany({
    where: { clientId: params.id },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(files);
}

// POST /api/clients/[id]/files — upload de contratos, PDFs, propostas, planilhas
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  const saved = await saveFile(file, `docs/${params.id}`);

  const asset = await prisma.fileAsset.create({
    data: {
      clientId: params.id,
      url: saved.url,
      filename: saved.filename,
      mimeType: saved.mimeType,
      size: saved.size,
    },
  });

  await logAudit({ userId: session.user.id, action: "upload_file", entity: "Client", entityId: params.id, metadata: { filename: saved.filename } });

  return NextResponse.json(asset, { status: 201 });
}
