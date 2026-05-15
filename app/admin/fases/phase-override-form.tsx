"use client";

import { useTransition, useState } from "react";
import { overridePhaseStatus } from "./actions";

type Phase = {
  id: string;
  status: string;
};

export default function PhaseOverrideForm({ phase }: { phase: Phase }) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handle(status: "open" | "closed") {
    setFeedback(null);
    startTransition(async () => {
      try {
        await overridePhaseStatus(phase.id, status, reason);
        setFeedback({ type: "success", message: `Fase ${status === "open" ? "aberta" : "fechada"} com sucesso.` });
        setReason("");
      } catch (err) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Erro" });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional)"
        className="flex-1 min-w-48 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        onClick={() => handle("open")}
        disabled={isPending || phase.status === "open"}
        className="rounded-lg bg-success/20 border border-success/30 px-4 py-1.5 text-sm font-medium text-success hover:bg-success/30 disabled:opacity-40 transition-colors"
      >
        Abrir
      </button>
      <button
        onClick={() => handle("closed")}
        disabled={isPending || phase.status === "closed"}
        className="rounded-lg bg-accent/20 border border-accent/30 px-4 py-1.5 text-sm font-medium text-accent hover:bg-accent/30 disabled:opacity-40 transition-colors"
      >
        Fechar
      </button>

      {feedback && (
        <span className={`text-xs ${feedback.type === "success" ? "text-success" : "text-accent"}`}>
          {feedback.message}
        </span>
      )}
    </div>
  );
}
