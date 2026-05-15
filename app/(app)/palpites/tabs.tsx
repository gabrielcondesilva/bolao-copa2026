"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PhaseStatusBanner from "@/components/phase-status-banner";
import MatchTab from "./match-tab";
import GroupTab from "./group-tab";
import TournamentTab from "./tournament-tab";

type Phase = { id: string; phase_key: string; label: string; status: string; close_at: string | null; order_index: number };
type Match = {
  id: string; scheduled_at: string; stage: string; group_id: string | null; status: string;
  home_team: { id: string; name: string; code: string; flag_url: string | null } | null;
  away_team: { id: string; name: string; code: string; flag_url: string | null } | null;
};
type Team = { id: string; name: string; code: string; flag_url: string | null; group_id: string | null };
type Player = { id: string; name: string; team_id: string | null };
type Group = { id: string; name: string };
type ExistingMatchPrediction = { match_id: string; home_score: number; away_score: number };
type ExistingGroupPrediction = { group_id: string; first_place_team_id: string | null; second_place_team_id: string | null };
type ExistingTournamentPrediction = {
  champion_team_id: string | null; runner_up_team_id: string | null;
  third_place_team_id: string | null; top_scorer_player_id: string | null;
} | null;

type Props = {
  initialPhases: Phase[];
  matches: Match[];
  existingMatchPredictions: ExistingMatchPrediction[];
  groups: Group[];
  existingGroupPredictions: ExistingGroupPrediction[];
  teams: Team[];
  players: Player[];
  existingTournamentPrediction: ExistingTournamentPrediction;
};

type TabKey = "matches" | "groups" | "tournament";

export default function PredictionsTabs({
  initialPhases,
  matches,
  existingMatchPredictions,
  groups,
  existingGroupPredictions,
  teams,
  players,
  existingTournamentPrediction,
}: Props) {
  const [phases, setPhases] = useState<Phase[]>(initialPhases);
  const [activeTab, setActiveTab] = useState<TabKey>("matches");

  // Subscribe to phase changes — when admin opens/closes a phase, inputs update instantly
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("phase-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "phase_schedule" },
        (payload) => {
          const updated = payload.new as Phase;
          setPhases((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const groupPhase = phases.find((p) => p.phase_key === "group");
  const isGroupPhaseOpen = groupPhase?.status === "open";

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "matches", label: "Partidas", count: matches.length },
    { key: "groups", label: "Grupos", count: groups.length },
    { key: "tournament", label: "Torneio" },
  ];

  return (
    <div className="space-y-4">
      <PhaseStatusBanner phase={groupPhase} />

      <div className="flex gap-1 rounded-xl bg-surface p-1 border border-white/5">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === key ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
            {count !== undefined && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                activeTab === key ? "bg-white/20 text-white" : "bg-white/5 text-muted"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "matches" && (
        <MatchTab
          matches={matches}
          existingPredictions={existingMatchPredictions}
          groups={groups}
          isOpen={isGroupPhaseOpen}
        />
      )}
      {activeTab === "groups" && (
        <GroupTab
          groups={groups}
          teams={teams}
          existingPredictions={existingGroupPredictions}
          isOpen={isGroupPhaseOpen}
        />
      )}
      {activeTab === "tournament" && (
        <TournamentTab
          teams={teams}
          players={players}
          existingPrediction={existingTournamentPrediction}
          isOpen={isGroupPhaseOpen}
        />
      )}
    </div>
  );
}
