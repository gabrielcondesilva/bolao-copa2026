"use client";

import { useState } from "react";
import { saveTournamentPrediction } from "./actions";

type Team = { id: string; name: string; code: string; flag_url: string | null; group_id: string | null };
type Player = { id: string; name: string; team_id: string | null };
type ExistingTournamentPrediction = {
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  top_scorer_player_id: string | null;
} | null;

export default function TournamentTab({
  teams,
  players,
  existingPrediction,
  isOpen,
}: {
  teams: Team[];
  players: Player[];
  existingPrediction: ExistingTournamentPrediction;
  isOpen: boolean;
}) {
  const [state, setState] = useState({
    champion: existingPrediction?.champion_team_id ?? "",
    runnerUp: existingPrediction?.runner_up_team_id ?? "",
    thirdPlace: existingPrediction?.third_place_team_id ?? "",
    topScorer: existingPrediction?.top_scorer_player_id ?? "",
    saving: false,
    result: null as string | null,
    isError: false,
  });

  function setField(field: string, value: string) {
    setState((prev) => ({ ...prev, [field]: value, result: null }));
  }

  async function handleSave() {
    setState((prev) => ({ ...prev, saving: true, result: null, isError: false }));
    try {
      await saveTournamentPrediction({
        championTeamId: state.champion || null,
        runnerUpTeamId: state.runnerUp || null,
        thirdPlaceTeamId: state.thirdPlace || null,
        topScorerPlayerId: state.topScorer || null,
      });
      setState((prev) => ({ ...prev, saving: false, result: "Palpites salvos com sucesso!", isError: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        saving: false,
        result: err instanceof Error ? err.message : "Erro ao salvar",
        isError: true,
      }));
    }
  }

  const teamFields: Array<{ key: string; label: string; helpText: string }> = [
    { key: "champion", label: "Campeão", helpText: "8 pts se acertar" },
    { key: "runnerUp", label: "Vice-campeão", helpText: "5 pts se acertar" },
    { key: "thirdPlace", label: "3º lugar", helpText: "3 pts se acertar" },
  ];

  return (
    <div className="max-w-md space-y-5">
      <p className="text-sm text-muted">
        Estes palpites ficam bloqueados junto com a fase de grupos.
      </p>

      {teamFields.map(({ key, label, helpText }) => (
        <div key={key}>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <span className="text-xs text-muted">{helpText}</span>
          </div>
          <select
            value={state[key as keyof typeof state] as string}
            onChange={(e) => setField(key, e.target.value)}
            disabled={!isOpen}
            className="w-full rounded-lg bg-surface border border-white/10 px-3 py-2.5 text-sm text-foreground disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">— selecionar seleção —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>
      ))}

      <div>
        <div className="flex items-baseline justify-between mb-1">
          <label className="text-sm font-medium text-foreground">Artilheiro</label>
          <span className="text-xs text-muted">6 pts se acertar</span>
        </div>
        <select
          value={state.topScorer}
          onChange={(e) => setField("topScorer", e.target.value)}
          disabled={!isOpen}
          className="w-full rounded-lg bg-surface border border-white/10 px-3 py-2.5 text-sm text-foreground disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">— selecionar jogador —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {players.length === 0 && (
          <p className="text-xs text-muted mt-1">Nenhum jogador cadastrado ainda.</p>
        )}
      </div>

      {isOpen && (
        <div className="flex items-center justify-between pt-2">
          {state.result && (
            <span className={`text-sm ${state.isError ? "text-accent" : "text-success"}`}>
              {state.result}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={state.saving}
            className="ml-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {state.saving ? "Salvando..." : "Salvar palpites"}
          </button>
        </div>
      )}

      {!isOpen && (
        <p className="text-sm text-muted pt-2">
          A fase de grupos está fechada. Seus palpites estão bloqueados.
        </p>
      )}
    </div>
  );
}
