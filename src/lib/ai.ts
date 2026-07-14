import Anthropic from "@anthropic-ai/sdk";

// IMPORTANTE (briefing, seção 3.7 e 5): a chave da Anthropic vive só aqui,
// no servidor, lida de variável de ambiente. Nunca é exposta ao frontend.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type BrandFitResult = {
  brandLabel: "Veron" | "Arena 360" | "Ambas" | "Indefinido";
  reasoning: string;
};

export async function analyzeClientBrandFit(client: {
  company: string;
  city?: string | null;
}): Promise<BrandFitResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");
  }

  const prompt = `Você ajuda a decidir qual das duas empresas abaixo deve atender um determinado cliente/escola.

Empresa "Veron Produções": especializada em formaturas de colégios (organiza a festa/cerimônia de formatura de turmas do ensino fundamental e médio).
Empresa "Arena 360": especializada em aulas extracurriculares dentro de escolas (atividades esportivas, artísticas ou educacionais no contraturno).

Cliente a avaliar: "${client.company}"${client.city ? `, localizado em ${client.city}` : ""}.

Pesquise na web informações públicas sobre essa instituição (se for escola/colégio) — tipo de instituição, público-alvo, sinais de que tenha turmas formandas ou programas de contraturno — para concluir qual empresa tem o perfil mais aderente: Veron, Arena 360, ou Ambas.

Responda em português, começando EXATAMENTE com uma das linhas abaixo (sem nada antes):
RECOMENDACAO: Veron
RECOMENDACAO: Arena 360
RECOMENDACAO: Ambas
RECOMENDACAO: Indefinido

Na linha seguinte, escreva uma justificativa curta (no máximo 3 frases) baseada no que encontrou.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
    tools: [{ type: "web_search_20250305", name: "web_search" } as any],
  });

  let rawText = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
  rawText = rawText.replace(/\*\*/g, "").replace(/__/g, "");

  const recPattern = /RECOMENDA[CÇ][AÃ]O:\s*(Veron|Arena 360|Ambas|Indefinido)/i;
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  let brandLabel: BrandFitResult["brandLabel"] = "Indefinido";
  let reasoning = "";
  const recLineIdx = lines.findIndex((l) => recPattern.test(l));

  if (recLineIdx !== -1) {
    const m = lines[recLineIdx].match(recPattern)!;
    brandLabel = m[1] as BrandFitResult["brandLabel"];
    const sameLineRemainder = lines[recLineIdx].replace(recPattern, "").trim();
    const restLines = lines.slice(recLineIdx + 1);
    reasoning = [sameLineRemainder, ...restLines].filter(Boolean).join(" ").trim();
  } else {
    const m2 = rawText.match(recPattern);
    if (m2) brandLabel = m2[1] as BrandFitResult["brandLabel"];
    reasoning = rawText.replace(recPattern, "").trim();
  }

  if (!reasoning) {
    reasoning = "A IA não retornou uma justificativa detalhada desta vez — tente analisar novamente.";
  }

  return { brandLabel, reasoning };
}
