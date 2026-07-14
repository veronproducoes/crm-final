import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Armazenamento de arquivos.
 *
 * Por padrão (STORAGE_DRIVER=local ou não definido) os arquivos são salvos em
 * /public/uploads, o que funciona bem em desenvolvimento mas NÃO é durável em
 * hospedagens serverless (Vercel) — o filesystem é efêmero lá.
 *
 * Para produção, troque a implementação abaixo por Cloudflare R2, Supabase
 * Storage ou S3 (ver briefing, seção 5 — Requisitos não-funcionais). A
 * interface pública (`saveFile`) permanece a mesma, então o resto do app não
 * precisa mudar.
 */
export async function saveFile(file: File, subfolder = "misc"): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const driver = process.env.STORAGE_DRIVER || "local";

  if (driver === "s3") {
    throw new Error(
      "STORAGE_DRIVER=s3 configurado, mas o adaptador S3/R2 ainda não foi implementado. " +
        "Implemente aqui usando @aws-sdk/client-s3 (endpoint do R2 ou S3) antes de usar em produção."
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const safeName = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_DIR, subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), bytes);

  return {
    url: `/uploads/${subfolder}/${safeName}`,
    filename: file.name,
    size: bytes.length,
    mimeType: file.type,
  };
}
