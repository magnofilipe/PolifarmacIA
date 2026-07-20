import React from "react";
import { AlertTriangle, X } from "lucide-react";

export type RagJustification = {
  gravidade: string;
  mecanismo: string;
  conduta: string;
  texto: string;
};

export type Conflict = {
  id: number;
  par: string;
  medicamento_1: string;
  medicamento_2: string;
  efeito: string;
  acao: string;
  recomendacao: string;
  justificativa?: RagJustification;
  rag_indisponivel?: boolean;
};

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: Conflict[];
  loading?: boolean;
}

export function InteractionModal({ isOpen, onClose, conflicts, loading = false }: InteractionModalProps) {
  if (!isOpen) return null;

  // Função para retornar a cor baseada no tipo de ação (gravidade)
  const getColorByAcao = (acao: string) => {
    const act = acao.toLowerCase();
    if (act.includes("contraindicado")) return "bg-red-100 border-red-300 text-red-900";
    if (act.includes("evitar a associação")) return "bg-orange-100 border-orange-300 text-orange-900";
    if (act.includes("geralmente evitar")) return "bg-amber-100 border-amber-300 text-amber-900";
    if (act.includes("monitorizar")) return "bg-yellow-100 border-yellow-300 text-yellow-900";
    if (act.includes("ajustar a dose")) return "bg-blue-100 border-blue-300 text-blue-900";
    return "bg-slate-100 border-slate-300 text-slate-900";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card shadow-elegant">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-bold tracking-tight">Interações Detectadas</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="mb-6 text-sm text-muted-foreground">
            Foram encontradas <strong className="text-foreground">{conflicts.length}</strong> interações medicamentosas nos medicamentos prescritos. 
            Verifique as recomendações abaixo antes de prosseguir.
          </p>

          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div
                key={`${conflict.id}-${index}`}
                className={`rounded-lg border p-4 ${getColorByAcao(conflict.acao)}`}
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold">
                    {conflict.medicamento_1} + {conflict.medicamento_2}
                  </h3>
                  <span className="shrink-0 rounded-full bg-white/50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                    {conflict.acao || "Atenção"}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong className="font-semibold">Efeito:</strong> {conflict.efeito}
                  </p>
                  <p>
                    <strong className="font-semibold">Recomendação:</strong> {conflict.recomendacao}
                  </p>
                </div>

                {conflict.justificativa && (
                  <div className="mt-3 space-y-2 rounded-md border border-current/20 bg-white/40 p-3 text-sm leading-relaxed">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Justificativa clínica (gerada por IA a partir da base determinística)
                    </p>
                    <p>{conflict.justificativa.texto}</p>
                    <p>
                      <strong className="font-semibold">Mecanismo:</strong> {conflict.justificativa.mecanismo}
                    </p>
                    <p>
                      <strong className="font-semibold">Conduta sugerida:</strong> {conflict.justificativa.conduta}
                    </p>
                  </div>
                )}

                {!conflict.justificativa && loading && (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-current/20 bg-white/40 p-3 text-sm">
                    <span className="opacity-70">Gerando justificativa clínica com IA</span>
                    <span className="inline-flex items-end gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "-0.3s" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "-0.15s" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    </span>
                  </div>
                )}

                {!conflict.justificativa && !loading && conflict.rag_indisponivel && (
                  <p className="mt-3 text-xs italic opacity-70">
                    Justificativa por IA indisponível no momento — o alerta acima é baseado apenas na base determinística de interações.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ciente, fechar alertas
          </button>
        </div>
      </div>
    </div>
  );
}
