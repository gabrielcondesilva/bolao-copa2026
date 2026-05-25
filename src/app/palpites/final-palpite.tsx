'use client'

import { useActionState, useState } from 'react'
import { savePalpiteFinal } from '@/app/actions/palpites'
import type { Database } from '@/lib/supabase/types'

type Team = Pick<Database['public']['Tables']['teams']['Row'], 'id' | 'name' | 'group'>
type PalpiteFinal = Database['public']['Tables']['palpites_finais']['Row']

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

interface Props {
  allTeams: Team[]
  existing: PalpiteFinal | null
  deadlineAt: string | null
}

export function FinalPalpiteForm({ allTeams, existing, deadlineAt }: Props) {
  const [state, action, pending] = useActionState(savePalpiteFinal, undefined)
  const [editing, setEditing] = useState(!existing)
  const isLocked = deadlineAt !== null && new Date(deadlineAt) <= new Date()

  const teamById = new Map(allTeams.map(t => [t.id, t.name]))

  const teamsByGroup: Record<string, Team[]> = {}
  for (const g of GROUPS) {
    teamsByGroup[g] = allTeams.filter(t => t.group === g).sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 border-green-200 bg-white">
      <div className="flex items-center justify-between border-b border-green-100 bg-green-50 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Palpite Final</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Trava no prazo da Fase de Grupos</p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              Prazo encerrado
            </span>
          ) : existing && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Editar
            </button>
          ) : (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Aberto
            </span>
          )}
        </div>
      </div>

      {/* View mode */}
      {existing && !editing && (
        <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ViewRow label="🥇 Campeão"          value={teamById.get(existing.champion_team_id ?? '') ?? '—'} />
          <ViewRow label="🥈 Vice-campeão"      value={teamById.get(existing.runner_up_team_id ?? '') ?? '—'} />
          <ViewRow label="🥉 3º Colocado"       value={teamById.get(existing.third_team_id ?? '') ?? '—'} />
          <ViewRow label="4º Colocado"          value={teamById.get(existing.fourth_team_id ?? '') ?? '—'} />
          <ViewRow label="Artilheiro"           value={existing.top_scorer ?? '—'} />
          <ViewRow label="Craque do Torneio"    value={existing.best_player ?? '—'} />
        </div>
      )}

      {/* Edit mode */}
      {(editing || !existing) && (
        <form
          action={async (fd) => {
            await action(fd)
            setEditing(false)
          }}
          className="p-4 space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TeamSelect label="🥇 Campeão"       name="champion_team_id"  teamsByGroup={teamsByGroup} defaultValue={existing?.champion_team_id ?? ''}  disabled={isLocked || pending} />
            <TeamSelect label="🥈 Vice-campeão"   name="runner_up_team_id" teamsByGroup={teamsByGroup} defaultValue={existing?.runner_up_team_id ?? ''} disabled={isLocked || pending} />
            <TeamSelect label="🥉 3º Colocado"    name="third_team_id"     teamsByGroup={teamsByGroup} defaultValue={existing?.third_team_id ?? ''}     disabled={isLocked || pending} />
            <TeamSelect label="4º Colocado"      name="fourth_team_id"    teamsByGroup={teamsByGroup} defaultValue={existing?.fourth_team_id ?? ''}    disabled={isLocked || pending} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput label="Artilheiro"        name="top_scorer"   defaultValue={existing?.top_scorer ?? ''}  disabled={isLocked || pending} />
            <TextInput label="Craque do Torneio" name="best_player"  defaultValue={existing?.best_player ?? ''} disabled={isLocked || pending} />
          </div>

          {!isLocked && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {pending ? 'Salvando…' : 'Salvar palpite final'}
              </button>
              {existing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Cancelar
                </button>
              )}
              {state && 'success' in state && (
                <span className="text-sm text-green-600">✓ Salvo</span>
              )}
              {state && 'error' in state && (
                <span className="text-sm text-red-600">{state.error}</span>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  )
}

function TeamSelect({ label, name, teamsByGroup, defaultValue, disabled }: {
  label: string; name: string; teamsByGroup: Record<string, Team[]>; defaultValue: string; disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="rounded border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        <option value="">— Selecionar —</option>
        {GROUPS.map(g =>
          teamsByGroup[g]?.length > 0 ? (
            <optgroup key={g} label={`Grupo ${g}`}>
              {teamsByGroup[g].map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          ) : null,
        )}
      </select>
    </div>
  )
}

function TextInput({ label, name, defaultValue, disabled }: {
  label: string; name: string; defaultValue: string; disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder="Nome do jogador…"
        className="rounded border border-zinc-300 px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-zinc-50 disabled:text-zinc-400"
      />
    </div>
  )
}
