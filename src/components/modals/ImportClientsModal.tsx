"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { mutate } from "swr";
import { useTheme } from "@/lib/theme";
import { Download, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";

type ParsedRow = {
  company: string;
  contactName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  address?: string;
  origin?: string;
  brands: ("VERON" | "ARENA360")[];
};

const TEMPLATE_CSV = `Empresa,Contato,Telefone,WhatsApp,Email,Cidade,Endereco,Marca,Origem
Colegio Exemplo,Maria Silva,(11) 98888-7777,(11) 98888-7777,maria@colegioexemplo.com.br,Sao Paulo,Rua das Flores 123,veron,Trello
`;

function parseBrands(raw: string): ("VERON" | "ARENA360")[] {
  const v = (raw || "").toLowerCase();
  const brands: ("VERON" | "ARENA360")[] = [];
  if (v.includes("ambas") || v.includes("veron")) brands.push("VERON");
  if (v.includes("ambas") || v.includes("arena")) brands.push("ARENA360");
  return brands;
}

function normalizeKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ImportClientsModal({ onClose }: { onClose: () => void }) {
  const T = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao-clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const parsedRows: ParsedRow[] = [];

        (results.data as Record<string, string>[]).forEach((raw, idx) => {
          const normalized: Record<string, string> = {};
          Object.entries(raw).forEach(([k, v]) => {
            normalized[normalizeKey(k)] = (v || "").toString().trim();
          });

          const company = normalized["empresa"] || "";
          const contactName = normalized["contato"] || "";

          if (!company || !contactName) {
            errors.push(`Linha ${idx + 2}: faltando "Empresa" ou "Contato" — linha ignorada.`);
            return;
          }

          parsedRows.push({
            company,
            contactName,
            phone: normalized["telefone"] || undefined,
            whatsapp: normalized["whatsapp"] || undefined,
            email: normalized["email"] || undefined,
            city: normalized["cidade"] || undefined,
            address: normalized["endereco"] || undefined,
            origin: normalized["origem"] || undefined,
            brands: parseBrands(normalized["marca"] || ""),
          });
        });

        setRows(parsedRows);
        setParseErrors(errors);
      },
      error: (err) => {
        setParseErrors([`Não foi possível ler o arquivo: ${err.message}`]);
      },
    });
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Erro ao importar.");
      setResult(data);
      mutate("/api/clients");
    } catch (e: any) {
      setParseErrors([e.message]);
    } finally {
      setImporting(false);
    }
  }

  const inputStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt, color: T.text };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: T.overlay }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ background: T.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2">
            <Upload size={18} color={T.brand} />
            <span className="text-base font-bold" style={{ color: T.text, fontFamily: "'Space Grotesk', sans-serif" }}>
              Importar clientes via CSV
            </span>
          </div>
          <button onClick={onClose}>
            <X size={18} color={T.textMuted} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="text-sm" style={{ color: T.textMuted }}>
            Todos os clientes importados entram como <b>novo lead</b> na coluna "Leads" do Kanban. Baixe o modelo,
            preencha com os dados (por exemplo, copiados do seu Trello) e envie o arquivo abaixo.
          </div>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ border: `1px solid ${T.line}`, color: T.text }}
          >
            <Download size={15} /> Baixar modelo CSV
          </button>

          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
              style={{ background: T.brand }}
            >
              <Upload size={15} /> Selecionar arquivo CSV preenchido
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
            {fileName && (
              <span className="text-xs ml-3" style={{ color: T.textMuted }}>
                {fileName}
              </span>
            )}
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "#E5484D14", color: "#E5484D" }}>
              {parseErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && !result && (
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: T.text }}>
                Pré-visualização — {rows.length} cliente(s) prontos para importar
              </div>
              <div className="rounded-lg overflow-hidden max-h-56 overflow-y-auto" style={{ border: `1px solid ${T.line}` }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      {["Empresa", "Contato", "Cidade", "Marca"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium" style={{ color: T.textMuted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${T.line}` }}>
                        <td className="px-3 py-1.5" style={{ color: T.text }}>
                          {r.company}
                        </td>
                        <td className="px-3 py-1.5" style={{ color: T.textMuted }}>
                          {r.contactName}
                        </td>
                        <td className="px-3 py-1.5" style={{ color: T.textMuted }}>
                          {r.city || "—"}
                        </td>
                        <td className="px-3 py-1.5" style={{ color: T.textMuted }}>
                          {r.brands.length ? r.brands.join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg p-3 text-sm space-y-2" style={{ background: "#12B76A14", color: "#12B76A" }}>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={15} />
                {result.created} cliente(s) importado(s) com sucesso!
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs" style={{ color: "#E5484D" }}>
                  {result.errors.length} linha(s) com erro: {result.errors.map((e) => `linha ${e.row}`).join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: T.textMuted }}>
            {result ? "Fechar" : "Cancelar"}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={rows.length === 0 || importing}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ background: T.brand }}
            >
              {importing ? "Importando..." : `Importar ${rows.length || ""} cliente(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
