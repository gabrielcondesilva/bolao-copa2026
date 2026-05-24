'use client'

import { useActionState, useState } from 'react'
import { saveClassifierOverride } from '@/app/actions/overrides'

const PHASES = [
  { value: 'round_of_32',   label: '16-avos — Melhores 3ºs (8)' },
  { value: 'round_of_16',   label: 'Oitavas de Final' },
  { value: 'quarterfinals', label: 'Quartas de Final' },
  { value: 'semifinals',    label: 'Semifinais' },
  { value: 'third_place',   label: 'Disputa de 3º Lugar' },
  { value: 'final',         label: 'Final' },
]

interface Team { id: string; name: string }

export function ClassifierOverrideForm({ teams }: { teams: Team[] }) {
  const [state, action, pending] = useActionState(saveClassifierOverride, undefined)
  const [slots, setSlots] = useState<string[]>(['', '', '', '', '', '', '', ''])

  const addSlot = () => setSlots(s => [...s, ''])
  const removeSlot = (i: number) => setSlots(s => s.filter((_, idx) => idx !== i))
  const setSlot = (i: number, val: string) => setSlots(s => s.map((v, idx) => idx === i ? val : v))

  return (
    <form action={action} className="space-y-4">
      <div className="max-w-xs">
        <label className="mb-1 block text-xs font-medium text-zinc-600">Fase</label>
        <select name="phase" required className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-green-500 focus:outline-none">
          {PHASES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-600">Times classificados (em ordem)</p>
        {slots.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-xs text-zinc-400">{i + 1}.</span>
            <select
              name="team_id"
              value={val}
              onChange={e => setSlot(i, e.target.value)}
              className="flex-1 rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:border-green-500 focus:outline-none"
            >
              <option value="">— Selecione —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="text-xs text-zinc-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSlot}
          className="text-xs text-green-700 hover:text-green-800 font-medium"
        >
          + Adicionar posição
        </button>
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
