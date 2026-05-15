"use client";

import { useState, useMemo } from "react";
import { saveMatchPredictions } from "./actions";

type Match = {
  id: string;
  scheduled_at: string;
  stage: string;
  group_id: string | null;
  status: string;
  home_team: { id: string; name: string; code: string; flag_url: string | null } | null;
  away_team: { id: string; name: string; code: string; flag_url: string | null } | null;
};

type ExistingPrediction = { match_id: string; home_score: number; away_score: number };
type Group = { id: string; name: string };

type ScoreEntry = { home: string; away: string; dirty: boolean };
type GroupSaveState = { saving: boolean; result: string | null; isError: boolean };

export default function MatchTab({
  matches,
  existingPredictions,
  groups,
  isOpen,
}: {
  matches: Match[];
  existingPredictions: ExistingPrediction[];
  groups: Group[];
  isOpen: boolean;
}) {
  const predMap = useMemo(
    () => new Map(existingPredictions.map((p) => [p.match_id, p])),
    [existingPredictions]
  );
  const groupNameMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups]
  );

  const [scores, setScores] = useState<Record<string, ScoreEntry>>(() => {
    const init: Record<string, ScoreEntry> = {};
    for (const m of matches) {
      const ex = predMap.get(m.id);
      init[m.id] = { home: ex?.home_score?.toString() ?? "", away: ex?.away_score?.toString() ?? "", dirty: false };
    }
    return init;
  });

  const [saveStates, setSaveStates] = useState<Record<string, GroupSaveState>>({});

  // Group matches by group_id, sort groups by name
  const sortedGroups = useMemo(() => {
    const byGroup = new Map<string, Match[]>();
    for (const m of matches) {
      const key = m.group_id ?? "__unknown";
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(m);
    }
    return [...byGroup.entries()].sort(([a], [b]) => {
      const na = groupNameMap.get(a) ?? a;
      const nb = groupNameMap.get(b) ?? b;
      return na.localeCompare(nb);
    });
  }, [matches, groupNameMap]);

  function setScore(matchId: string, side: "home" | "away", value: string) {
    setScores((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [side]: value, dirty: true } }));
  }

  async function handleSave(groupId: string, groupMatches: Match[]) {
    const dirty = groupMatches.filter((m) => {
      const s = scores[m.id];
      return s?.dirty && s.home !== "" && s.away !== "";
    });

    if (dirty.length === 0) {
      setSaveStates((prev) => ({ ...prev, [groupId]: { saving: false, result: "Nenhuma alteração", isError: false } }));
      return;
    }

    setSaveStates((prev) => ({ ...prev, [groupId]: { saving: true, result: null, isError: false } }));

    try {
      const result = await saveMatchPredictions(
        "group",
        dirty.map((m) => ({
          matchId: m.id,
          homeScore: parseInt(scores[m.id].home, 10),
          awayScore: parseInt(scores[m.id].away, 10),
        }))
      );

      // Clear dirty flag for successfully saved entries
      const failedIds = new Set(result.failed.map((f) => f.matchId));
      setScores((prev) => {
        const next = { ...prev };
        for (const m of dirty) {
          if (!failedIds.has(m.id)) next[m.id] = { ...next[m.id], dirty: false };
        }
        return next;
      });

      const msg =
        result.failed.length > 0
          ? `${result.saved} salvos · ${result.failed.length} com erro`
          : `${result.saved} palpite${result.saved !== 1 ? "s" : ""} salvo${result.saved !== 1 ? "s" : ""}`;

      setSaveStates((prev) => ({ ...prev, [groupId]: { saving: false, result: msg, isError: result.failed.length > 0 } }));
    } catch (err) {
      setSaveStates((prev) => ({
        ...prev,
        [groupId]: { saving: false, result: err instanceof Error ? err.message : "Erro", isError: true },
      }));
    }
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map(([groupId, groupMatches]) => {
        const groupName = groupNameMap.get(groupId) ?? "?";
        const ss = saveStates[groupId];
        const hasDirty = groupMatches.some((m) => scores[m.id]?.dirty);

        return (
          <section key={groupId} className="bg-surface rounded-xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-foreground">Grupo {groupName}</h2>
              <div className="flex items-center gap-3">
                {ss?.result && (
                  <span className={`text-xs ${ss.isError ? "text-accent" : "text-success"}`}>{ss.result}</span>
                )}
                {isOpen && (
                  <button
                    onClick={() => handleSave(groupId, groupMatches)}
                    disabled={ss?.saving || !hasDirty}
                    className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    {ss?.saving ? "..." : "Salvar"}
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {groupMatches.map((m) => {
                const s = scores[m.id];
                const isPast = new Date(m.scheduled_at) <= new Date();
                const disabled = !isOpen || m.status !== "scheduled" || isPast;
                const scheduledBRT = new Date(m.scheduled_at).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={m.id} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="text-xs text-muted w-24 shrink-0 tabular-nums">{scheduledBRT}</span>
                    <span className="flex-1 text-sm text-foreground text-right truncate min-w-0">
                      {m.home_team?.name ?? "TBD"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      inputMode="numeric"
                      aria-label={`Gols de ${m.home_team?.name ?? "time da casa"}`}
                      value={s?.home ?? ""}
                      onChange={(e) => setScore(m.id, "home", e.target.value)}
                      disabled={disabled}
                      className="w-10 text-center rounded bg-white/5 border border-white/10 px-1 py-1 text-sm text-foreground disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-muted">×</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      inputMode="numeric"
                      aria-label={`Gols de ${m.away_team?.name ?? "time visitante"}`}
                      value={s?.away ?? ""}
                      onChange={(e) => setScore(m.id, "away", e.target.value)}
                      disabled={disabled}
                      className="w-10 text-center rounded bg-white/5 border border-white/10 px-1 py-1 text-sm text-foreground disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="flex-1 text-sm text-foreground truncate min-w-0">
                      {m.away_team?.name ?? "TBD"}
                    </span>
                    {m.status === "finished" && (
                      <span className="text-xs text-muted shrink-0">encerrada</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
