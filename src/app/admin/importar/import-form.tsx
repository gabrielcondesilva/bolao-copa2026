'use client'

import { useActionState } from 'react'
import { importMatches, type ImportResult } from '@/app/actions/import'

const PHASES = [
  { value: 'group_stage',   label: 'Fase de Grupos' },
  { value: 'round_of_32',  label: '16-avos' },
  { value: 'round_of_16',  label: 'Oitavas' },
  { value: 'quarterfinals', label: 'Quartas' },
  { value: 'semifinals',   label: 'Semifinais' },
  { value: 'third_place',  label: 'Disputa de 3º' },
  { value: 'final',        label: 'Final' },
]

const PHASE_LABELS: Record<string, string> = Object.fromEntries(PHASES.map(p => [p.value, p.label]))

export function ImportForm() {
  const [state, action, pending] = useActionState(importMatches, undefined)

  return (
    <div>
      <form action={action} className="flex items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="phase" className="text-sm font-medium text-zinc-700">
            Fase
          </label>
          <select
            id="phase"
            name="phase"
            defaultValue="group_stage"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          >
            {PHASES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {pending ? 'Importando…' : 'Importar via API'}
        </button>
      </form>

      {state && 'error' in state && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state && 'imported' in state && (
        <ImportResultCard result={state} />
      )}
    </div>
  )
}

function ImportResultCard({ result }: { result: ImportResult }) {
  const ts = new Date(result.timestamp).toLocaleString('pt-BR')
  const phaseLabel = PHASE_LABELS[result.phase] ?? result.phase

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">
          Resultado — {phaseLabel}
        </span>
        <span className="text-xs text-zinc-400">{ts}</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-zinc-100 text-center">
        <Stat label="Resultados novos" value={result.imported} color="text-green-700" />
        <Stat label="Atualizados" value={result.updated} color="text-blue-700" />
        <Stat label="Equipes" value={result.teamsUpserted} color="text-zinc-700" />
      </div>

      {result.errors.length > 0 && (
        <div className="border-t border-red-100 px-4 py-3">
          <p className="text-xs font-medium text-red-700 mb-1">Erros ({result.errors.length})</p>
          <ul className="space-y-0.5">
            {result.errors.map((e, i) => (
              <li key={i} className="text-xs text-red-600">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-4 py-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  )
}
