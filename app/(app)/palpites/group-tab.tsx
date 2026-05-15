"use client";

import { useState, useMemo } from "react";
import { saveGroupPrediction } from "./actions";

type Group = { id: string; name: string };
type Team = { id: string; name: string; code: string; flag_url: string | null; group_id: string | null };
type ExistingGroupPrediction = {
  group_id: string;
  first_place_team_id: string | null;
  second_place_team_id: string | null;
};

type GroupState = {
  first: string;
  second: string;
  saving: boolean;
  result: string | null;
  isError: boolean;
};

export default function GroupTab({
  groups,
  teams,
  existingPredictions,
  isOpen,
}: {
  groups: Group[];
  teams: Team[];
  existingPredictions: ExistingGroupPrediction[];
  isOpen: boolean;
}) {
  const predMap = useMemo(
    () => new Map(existingPredictions.map((p) => [p.group_id, p])),
    [existingPredictions]
  );
  const teamsByGroup = useMemo(() => {
    const map = new Map<string, Team[]>();
    for (const t of teams) {
      if (t.group_id) {
        if (!map.has(t.group_id)) map.set(t.group_id, []);
        map.get(t.group_id)!.push(t);
      }
    }
    return map;
  }, [teams]);

  const [states, setStates] = useState<Record<string, GroupState>>(() => {
    const init: Record<string, GroupState> = {};
    for (const g of groups) {
      const ex = predMap.get(g.id);
      init[g.id] = {
        first: ex?.first_place_team_id ?? "",
        second: ex?.second_place_team_id ?? "",
        saving: false,
        result: null,
        isError: false,
      };
    }
    return init;
  });

  function update(groupId: string, field: "first" | "second", value: string) {
    setStates((prev) => ({ ...prev, [groupId]: { ...prev[groupId], [field]: value, result: null } }));
  }

  async function handleSave(groupId: string) {
    const { first, second } = states[groupId];

    if (first && second && first === second) {
      setStates((prev) => ({
        ...prev,
        [groupId]: { ...prev[groupId], result: "1º e 2º não podem ser a mesma seleção", isError: true },
      }));
      return;
    }

    setStates((prev) => ({ ...prev, [groupId]: { ...prev[groupId], saving: true, result: null, isError: false } }));

    try {
      await saveGroupPrediction(groupId, first || null, second || null);
      setStates((prev) => ({ ...prev, [groupId]: { ...prev[groupId], saving: false, result: "Salvo", isError: false } }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [groupId]: { ...prev[groupId], saving: false, result: err instanceof Error ? err.message : "Erro", isError: true },
      }));
    }
  }

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups]
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sortedGroups.map((group) => {
        const groupTeams = teamsByGroup.get(group.id) ?? [];
        const s = states[group.id];

        const firstTeams = groupTeams.filter((t) => t.id !== s.second);
        const secondTeams = groupTeams.filter((t) => t.id !== s.first);

        return (
          <div key={group.id} className="bg-surface rounded-xl p-4 border border-white/5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Grupo {group.name}</h3>

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-muted mb-1">1º lugar</label>
                <select
                  value={s.first}
                  onChange={(e) => update(group.id, "first", e.target.value)}
                  disabled={!isOpen}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— selecionar —</option>
                  {firstTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">2º lugar</label>
                <select
                  value={s.second}
                  onChange={(e) => update(group.id, "second", e.target.value)}
                  disabled={!isOpen}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— selecionar —</option>
                  {secondTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {s.result ? (
                <span className={`text-xs ${s.isError ? "text-accent" : "text-success"}`}>{s.result}</span>
              ) : (
                <span />
              )}
              {isOpen && (
                <button
                  onClick={() => handleSave(group.id)}
                  disabled={s.saving}
                  className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {s.saving ? "..." : "Salvar"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
