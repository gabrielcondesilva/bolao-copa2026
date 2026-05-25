'use client'

import { useActionState } from 'react'
import { upsertGlobalException } from '@/app/actions/deadlines'

const PHASES = [
  { value: 'group_stage',   label: 'Fase de Grupos' },
  { value: 'round_of_32',  label: '16-avos' },
  { value: 'round_of_16',  label: 'Oitavas' },
  { value: 'quarterfinals', label: 'Quartas' },
  { value: 'semifinals',   label: 'Semifinais' },
  { value: 'third_place',  label: 'Disputa de 3º' },
  { value: 'final',        label: 'Final' },
]

export function ExceptionForm() {
  const [state, action, pending] = useActionState(upsertGlobalException, undefined)

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-600">Fase</label>
        <select
          name="phase"
          required
          defaultValue=""
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        >
          <option value="" disabled>Selecionar…</option>
          {PHASES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-600">Liberar até (UTC)</label>
        <input
          name="unlocked_until"
          type="datetime-local"
          required
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        />
      </div>

      <div className="flex items-center gap-2 pb-0.5">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {pending ? '…' : 'Salvar edição de prazo'}
        </button>
        {state && 'success' in state && (
          <span className="text-sm text-green-600">✓ Salvo</span>
        )}
        {state && 'error' in state && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  )
}
