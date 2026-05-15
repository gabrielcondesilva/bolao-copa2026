"use client";

import { useState, useTransition } from "react";
import { triggerMassRecalculate } from "./actions";

export default function RecalculateButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    matchesProcessed: number;
    groupsProcessed: number;
    errors: string[];
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setConfirmed(false);
    startTransition(async () => {
      const r = await triggerMassRecalculate();
      setResult(r);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Recalcula pontuação de <strong>todas</strong> as partidas encerradas. Operação lenta — evite durante jogos ao vivo.
      </p>
      <button
        onClick={handleClick}
        disabled={pending}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          confirmed
            ? "bg-accent text-white hover:bg-accent/90"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
      >
        {pending ? "Recalculando…" : confirmed ? "Confirmar recálculo?" : "Recalcular Tudo"}
      </button>

      {result && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-sm space-y-1">
          <p className="text-foreground">
            ✓ {result.matchesProcessed} partidas · {result.groupsProcessed} grupos processados
          </p>
          {result.errors.length > 0 && (
            <p className="text-accent text-xs">
              {result.errors.length} erro(s): {result.errors.slice(0, 3).join("; ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
