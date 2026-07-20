import { Type } from "@google/genai";
import { gemini } from "../../config/gemini.js";
import type { RagJustification } from "../../types/analysis.js";
import type { PatientProfile } from "../../types/patient.js";
import type { RetrievedContext } from "../rag/rag.service.js";
import { loosePairKey } from "../../utils/normalize.js";
import { withRetry } from "../../utils/retry.js";
import { getCached, setCached } from "./cache.js";

// Alias "lite" do flash atual: baixa latência (~1-2s vs ~12s do flash normal) e à prova
// de descontinuação (o gemini-2.5-flash, por ex., ficou indisponível para chaves novas).
// A tarefa aqui é resumir um contexto já entregue, então o modelo lite é adequado.
const MODEL = "gemini-flash-lite-latest";

const JUSTIFICATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    justificativas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          par: {
            type: Type.STRING,
            description: "Par de medicamentos exatamente como informado no prompt (campo 'Par:').",
          },
          gravidade: {
            type: Type.STRING,
            description: "Classificação de gravidade clínica, derivada da conduta determinística informada — nunca inventada.",
          },
          mecanismo: {
            type: Type.STRING,
            description: "Mecanismo fisiológico da interação, baseado nos trechos recuperados.",
          },
          conduta: {
            type: Type.STRING,
            description: "Conduta clínica recomendada, curta e direta, consistente com a recomendação cadastrada.",
          },
          texto: {
            type: Type.STRING,
            description: "Justificativa clínica curta (2 a 4 frases) para o médico.",
          },
        },
        required: ["par", "gravidade", "mecanismo", "conduta", "texto"],
      },
    },
  },
  required: ["justificativas"],
};

const SYSTEM_INSTRUCTION = `Você é um assistente clínico de apoio à decisão para manejo de polifarmácia em geriatria.
Regras estritas:
- O motor de regras determinístico é a ÚNICA fonte de verdade sobre a existência e a conduta de cada interação medicamentosa. Você NUNCA deve contradizê-lo, minimizá-lo, ou sugerir que uma interação listada não existe ou é segura.
- Use os trechos recuperados apenas para explicar o mecanismo fisiológico e enriquecer a conduta com contexto clínico. Se não houver trechos para um par, baseie-se apenas nos dados determinísticos fornecidos para aquele par.
- Adapte a explicação à idade/condições do paciente quando informadas, sem inventar dados que não foram fornecidos.
- Seja direto e clínico, evite jargão desnecessário. Responda estritamente no formato JSON solicitado, um item por par de medicamentos, na mesma ordem em que os pares foram apresentados.`;

function buildPatientSection(patient?: PatientProfile): string {
  if (!patient) return "Nenhum dado de paciente informado.";

  const parts = [
    patient.full_name ? `Nome: ${patient.full_name}` : null,
    patient.birth_date ? `Data de nascimento: ${patient.birth_date}` : null,
    patient.sex ? `Sexo: ${patient.sex}` : null,
    patient.conditions ? `Condições clínicas: ${patient.conditions}` : null,
    patient.notes ? `Observações: ${patient.notes}` : null,
  ].filter((p): p is string => Boolean(p));

  return parts.length > 0 ? parts.join("\n") : "Nenhum dado de paciente informado.";
}

function buildContextSection(contexts: RetrievedContext[]): string {
  return contexts
    .map(({ conflict, chunks }) => {
      const chunkText =
              chunks.length > 0
                ? chunks
                    .slice(0, 2)
                    .map(
                      (c, i) =>
                        ` [Trecho ${i + 1}] ${c.texto.slice(0, 500)}`
                    )
                    .join("\n")          
        : "  (nenhum trecho recuperado na base vetorial para este par)";

      return [
        `Par: ${conflict.par}`,
        `Conduta determinística: ${conflict.acao}`,
        `Efeito conhecido: ${conflict.efeito}`,
        `Recomendação cadastrada: ${conflict.recomendacao}`,
        "Trechos recuperados:",
        chunkText,
      ].join("\n");
    })
    .join("\n\n");
}

/**
 * Gera, via Gemini, uma justificativa clínica estruturada por par de conflito,
 * combinando o resultado do motor de regras com os trechos recuperados via RAG.
 * Lança erro em caso de falha — quem chama decide como degradar graciosamente.
 */
export async function generateJustifications(
  contexts: RetrievedContext[],
  patient?: PatientProfile,
): Promise<Map<string, RagJustification>> {
  if (contexts.length === 0) return new Map();

  // CACHE: tenta retornar sem chamar Gemini
  const cached = contexts
    .map((c) => getCached(c.conflict.par))
    .filter(Boolean);

  if (cached.length === contexts.length) {
    return new Map(
      contexts.map((c, i) => [
        loosePairKey(c.conflict.par),
        cached[i]!,
      ]),
    );
  }

  const prompt = [
    "Dados do paciente:",
    buildPatientSection(patient),
    "",
    "Conflitos detectados pelo motor de regras (fonte de verdade) e trechos recuperados:",
    buildContextSection(contexts),
  ].join("\n");

  const response = await withRetry(
    () =>
      gemini.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: JUSTIFICATION_SCHEMA,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    { label: "generate" },
  );

  const raw = response.text;
  if (!raw) throw new Error("Gemini retornou resposta vazia.");

  const parsed = JSON.parse(raw) as {
    justificativas: (RagJustification & { par: string })[];
  };

  const byPar = new Map<string, RagJustification>();
  parsed.justificativas?.forEach((item, index) => {
    // Casamento primário: pela ordem em que os pares foram enviados (index).
    // Fallback: pelo `par` normalizado, caso o modelo reordene os itens.
    const conflictAtIndex = contexts[index]?.conflict.par;
    const justificativa: RagJustification = {
      gravidade: item.gravidade,
      mecanismo: item.mecanismo,
      conduta: item.conduta,
      texto: item.texto,
    };

    if (conflictAtIndex) byPar.set(loosePairKey(conflictAtIndex), justificativa);
    if (item.par) byPar.set(loosePairKey(item.par), justificativa);
  });
  const cachedResults = contexts
    .map(c => getCached(c.conflict.par))
    .filter(Boolean);

if(cachedResults.length === contexts.length){
    return new Map(
        contexts.map((c,i)=>[
            loosePairKey(c.conflict.par),
            cachedResults[i]!
        ])
    );
}

  return byPar;
}
