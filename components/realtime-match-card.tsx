"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export type MatchData = {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  scheduled_at: string;
  stage: string;
  home_team: { name: string; code: string; flag_url: string | null } | null;
  away_team: { name: string; code: string; flag_url: string | null } | null;
};

const STAGE_LABEL: Record<string, string> = {
  group: "Grupos",
  round_of_32: "Oitavas",
  round_of_16: "Dezesseis avos",
  quarter: "Quartas",
  semi: "Semifinal",
  third_place: "3º Lugar",
  final: "Final",
};

export default function RealtimeMatchCard({ initialMatch }: { initialMatch: MatchData }) {
  const [match, setMatch] = useState(initialMatch);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<MatchData>;
          setMatch((prev) => ({
            ...prev,
            home_score: updated.home_score ?? prev.home_score,
            away_score: updated.away_score ?? prev.away_score,
            status: updated.status ?? prev.status,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  const scheduledBRT = new Date(match.scheduled_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-surface rounded-xl border border-white/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted">{STAGE_LABEL[match.stage] ?? match.stage}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            AO VIVO
          </span>
        ) : isFinished ? (
          <span className="text-xs text-muted">Encerrado</span>
        ) : (
          <span className="text-xs text-muted">{scheduledBRT}</span>
        )}
      </div>

      {/* Score row */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <span className="truncate text-sm font-semibold text-foreground">
            {match.home_team?.name ?? "TBD"}
          </span>
          <span className="shrink-0 text-xs text-muted font-mono">
            {match.home_team?.code ?? "—"}
          </span>
        </div>

        {/* Score */}
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
          <ScoreDigit value={match.home_score} matchId={match.id} side="home" />
          <span className="text-muted text-sm">–</span>
          <ScoreDigit value={match.away_score} matchId={match.id} side="away" />
        </div>

        {/* Away team */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs text-muted font-mono">
            {match.away_team?.code ?? "—"}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">
            {match.away_team?.name ?? "TBD"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Animates when the score value changes: brief scale-up in green then settles
function ScoreDigit({
  value,
  matchId,
  side,
}: {
  value: number | null;
  matchId: string;
  side: string;
}) {
  const display = value !== null ? String(value) : "–";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={`${matchId}-${side}-${display}`}
        initial={{ scale: 1.5, color: "#00C853" }}
        animate={{ scale: 1, color: "#F0F0F5" }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="w-6 text-center font-mono text-lg font-bold tabular-nums"
      >
        {display}
      </motion.span>
    </AnimatePresence>
  );
}
