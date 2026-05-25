'use client'

import { useActionState } from 'react'
import { upsertPhaseDeadline } from '@/app/actions/deadlines'

interface Props {
  phase: string
  label: string
  currentDeadline: string | null
  firstMatchAt: string | null
}

export function DeadlineRow({ phase, label, currentDeadline, firstMatchAt }: Props) {
  const [state, action, pending] = useActionState(upsertPhaseDeadline, undefined)
  const inputValue = currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : ''
  const referenceLabel = firstMatchAt
    ? new Date(firstMatchAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
      })
    : '—'

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-4 py-3 font-medium text-zinc-900 w-36">{label}</td>
      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{referenceLabel}</td>
      <td colSpan={2} className="px-4 py-3">
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="phase" value={phase} />
          <input
            name="deadline_at"
            type="datetime-local"
            defaultValue={inputValue}
            required
            className="rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {pending ? '…' : 'Salvar'}
          </button>
          {state && 'success' in state && (
            <span className="text-xs text-green-600">✓ Salvo</span>
          )}
          {state && 'error' in state && (
            <span className="text-xs text-red-600">{state.error}</span>
          )}
        </form>
      </td>
    </tr>
  )
}
