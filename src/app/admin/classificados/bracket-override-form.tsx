'use client'

import { useActionState } from 'react'
import { saveBracketOverride } from '@/app/actions/overrides'

const PHASES = [
  { value: 'round_of_32',   label: '16-avos de Final' },
  { value: 'round_of_16',   label: 'Oitavas de Final' },
  { value: 'quarterfinals', label: 'Quartas de Final' },
  { value: 'semifinals',    label: 'Semifinais' },
  { value: 'third_place',   label: 'Disputa de 3º Lugar' },
  { value: 'final',         label: 'Final' },
]

interface Team { id: string; name: string }

export function BracketOverrideForm({ teams }: { teams: Team[] }) {
  const [state, action, pending] = useActionState(saveBracketOverride, undefined)

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Fase</label>
          <select name="phase" required className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-green-500 focus:outline-none">
            {PHASES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Slot (0-based)</label>
          <input
            name="match_slot"
            type="number"
            min={0}
            required
            placeholder="0"
            className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Time da Casa</label>
          <select name="home_team_id" className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-green-500 focus:outline-none">
            <option value="">— Indefinido —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Time Visitante</label>
          <select name="away_team_id" className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-green-500 focus:outline-none">
            <option value="">— Indefinido —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-green-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {pending ? 'Salvando…' : 'Salvar Override'}
        </button>
        {state && 'error' in state && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        {state && 'success' in state && (
          <p className="text-sm text-green-600">Salvo.</p>
        )}
      </div>
    </form>
  )
}
