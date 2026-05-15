"use client";

import { useState, useTransition } from "react";
import { saveMatchPredictions } from "@/app/(app)/palpites/actions";

type Team = { name: string; code: string; flag_url: string | null } | null;

export type BracketMatchData = {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  scheduled_at: string;
  home_team: Team;
  away_team: Team;
};

type Props = {
  match: BracketMatchData;
  prediction: { home_score: number; away_score: number } | null;
  phaseKey: string;
  phaseOpen: boolean;
};

function predictionClass(pred: { home_score: number; away_score: number }, result: { home_score: number; away_score: number }) {
  if (pred.home_score === result.home_score && pred.away_score === result.away_score) return "border-success/60 bg-success/5";
  const predWinner = Math.sign(pred.home_score - pred.away_score);
  const realWinner = Math.sign(result.home_score - result.away_score);
  if (predWinner === realWinner) return "border-yellow-500/60 bg-yellow-500/5";
  return "border-accent/60 bg-accent/5";
}

export default function BracketMatch({ match, prediction, phaseKey, phaseOpen }: Props) {
  const isFinished = match.status === "finished";
  const teamsKnown = match.home_team != null && match.away_team != null;
  const canPredict = phaseOpen && teamsKnown && !isFinished;

  const [home, setHome] = useState(prediction?.home_score?.toString() ?? "");
  const [away, setAway] = useState(prediction?.away_score?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const borderClass =
    isFinished && prediction
      ? predictionClass(prediction, { home_score: match.home_score!, away_score: match.away_score! })
      : "border-white/5";

  function handleSave() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    startTransition(async () => {
      await saveMatchPredictions(phaseKey, [{ matchId: match.id, homeScore: h, awayScore: a }]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
    <div className={`bg-surface rounded-xl border p-3 ${borderClass} transition-colors`}>
      <p className="text-xs text-muted mb-2">{scheduledBRT}</p>

      {/* Home row */}
      <TeamRow
        team={match.home_team}
        score={match.home_score}
        predScore={prediction?.home_score}
        isFinished={isFinished}
        inputValue={home}
        canPredict={canPredict}
        onChange={setHome}
      />

      <div className="my-1 border-t border-white/5" />

      {/* Away row */}
      <TeamRow
        team={match.away_team}
        score={match.away_score}
        predScore={prediction?.away_score}
        isFinished={isFinished}
        inputValue={away}
        canPredict={canPredict}
        onChange={setAway}
      />

      {canPredict && (
        <button
          onClick={handleSave}
          disabled={pending}
          className="mt-2 w-full rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold py-1.5 transition-colors disabled:opacity-50"
        >
          {saved ? "Salvo ✓" : pending ? "Salvando…" : "Salvar"}
        </button>
      )}
    </div>
  );
}

function TeamRow({
  team,
  score,
  predScore,
  isFinished,
  inputValue,
  canPredict,
  onChange,
}: {
  team: Team;
  score: number | null;
  predScore: number | undefined;
  isFinished: boolean;
  inputValue: string;
  canPredict: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {team?.flag_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.flag_url} alt={team.code} className="h-4 w-6 object-cover rounded-sm shrink-0" />
      )}
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {team?.name ?? "TBD"}
      </span>
      {isFinished ? (
        <div className="flex items-center gap-1.5">
          {predScore !== undefined && (
            <span className="text-xs text-muted tabular-nums">{predScore}</span>
          )}
          <span className="font-mono font-bold text-foreground tabular-nums">{score ?? "–"}</span>
        </div>
      ) : canPredict ? (
        <input
          type="number"
          min={0}
          max={20}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 rounded bg-white/10 text-center text-sm font-mono text-foreground tabular-nums border border-white/10 focus:outline-none focus:border-primary py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <span className="font-mono text-muted tabular-nums">{score ?? "–"}</span>
      )}
    </div>
  );
}
