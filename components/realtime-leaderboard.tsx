"use client";

import { motion } from "framer-motion";
import { useRealtimeScores, type LeaderboardEntry } from "@/hooks/use-realtime-scores";

type Props = {
  initial: LeaderboardEntry[];
  currentUserId: string;
};

export default function RealtimeLeaderboard({ initial, currentUserId }: Props) {
  const entries = useRealtimeScores(initial);

  // Stable sort: total_points DESC, then id ASC as tiebreaker so order never
  // flickers when two players have the same score.
  const sorted = [...entries].sort(
    (a, b) => b.total_points - a.total_points || a.id.localeCompare(b.id)
  );

  return (
    <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-foreground">Classificação</h2>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          ao vivo
        </span>
      </div>

      <div>
        {sorted.map((player, idx) => {
          const rank = idx + 1;
          // delta > 0 → rose, delta < 0 → fell, null → no yesterday data
          const delta =
            player.position_yesterday !== null
              ? player.position_yesterday - rank
              : null;
          const isMe = player.id === currentUserId;

          return (
            <motion.div
              key={player.id}
              layout="position"
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors ${
                isMe ? "bg-primary/5" : ""
              }`}
            >
              {/* Rank */}
              <span className="w-6 shrink-0 text-center text-sm font-bold text-muted tabular-nums">
                {rank}
              </span>

              {/* Delta indicator */}
              <Delta delta={delta} />

              {/* Name */}
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {player.name ?? "—"}
                {isMe && (
                  <span className="ml-2 text-xs font-normal text-primary/70">
                    (você)
                  </span>
                )}
              </span>

              {/* Points */}
              <span className="shrink-0 font-mono text-base font-bold text-foreground tabular-nums">
                {player.total_points}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Delta({ delta }: { delta: number | null }) {
  if (delta === null)
    return (
      <span className="w-8 shrink-0 text-center text-xs text-muted/50" title="Novo">
        •
      </span>
    );
  if (delta > 0)
    return (
      <span
        className="w-8 shrink-0 text-center text-xs font-semibold text-success"
        title={`Subiu ${delta} posição(ões)`}
      >
        ▲{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span
        className="w-8 shrink-0 text-center text-xs font-semibold text-accent"
        title={`Caiu ${Math.abs(delta)} posição(ões)`}
      >
        ▼{Math.abs(delta)}
      </span>
    );
  return (
    <span className="w-8 shrink-0 text-center text-xs text-muted" title="Mesma posição">
      —
    </span>
  );
}
