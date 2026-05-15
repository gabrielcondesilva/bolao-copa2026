"use client";

import { useTransition, useState } from "react";
import { saveMatchResult } from "./actions";

type Match = {
  id: string;
  stage: string;
  scheduled_at: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team: { name: string; code: string } | null;
  away_team: { name: string; code: string } | null;
};

export default function MatchResultForm({ match }: { match: Match }) {
  const [isPending, startTransition] = useTransition();
  const [home, setHome] = useState(match.home_score?.toString() ?? "");
  const [away, setAway] = useState(match.away_score?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFinished = match.status === "finished";
  const homeName = match.home_team?.name ?? "A definir";
  const awayName = match.away_team?.name ?? "A definir";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Placar inválido");
      return;
    }

    startTransition(async () => {
      try {
        await saveMatchResult(match.id, h, a);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  const scheduledBRT = new Date(match.scheduled_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3 border border-white/5"
    >
      <span className="text-xs text-muted w-28 shrink-0">{scheduledBRT}</span>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm text-foreground truncate text-right flex-1">{homeName}</span>
        <input
          type="number"
          min="0"
          max="20"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-12 text-center rounded bg-white/5 border border-white/10 px-1 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="—"
        />
        <span className="text-muted text-xs">×</span>
        <input
          type="number"
          min="0"
          max="20"
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-12 text-center rounded bg-white/5 border border-white/10 px-1 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="—"
        />
        <span className="text-sm text-foreground truncate flex-1">{awayName}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isFinished && !saved && (
          <span className="text-xs text-success">✓ Salvo</span>
        )}
        {saved && (
          <span className="text-xs text-success">✓ Atualizado</span>
        )}
        {error && (
          <span className="text-xs text-accent">{error}</span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
