import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Armazenamento de arquivos (logos, contratos, propostas, etc.)
 *
 * Em produção no Vercel, o sistema de arquivos é apagado a cada nova
 * requisição/deploy — por isso salvar em /public/uploads não funciona de
 * forma confiável lá. Este arquivo usa o Supabase Storage automaticamente
 * quando as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem
 * configuradas. Sem essas variáveis, cai de volta para salvar localmente em
 * /public/uploads (bom só para rodar no seu computador em desenvolvimento).
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function saveFile(file: File, subfolder = "misc"): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const supabase = getSupabaseClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const safeName = `${crypto.randomUUID()}${ext}`;
  const objectPath = `${subfolder}/${safeName}`;

  if (supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      throw new Error(`Falha ao enviar arquivo para o Supabase Storage: ${error.message}`);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return {
      url: data.publicUrl,
      filename: file.name,
      size: bytes.length,
      mimeType: file.type,
    };
  }

  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
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
