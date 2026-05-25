'use client'

import { useActionState } from 'react'
import { syncResults, type SyncResult } from '@/app/actions/sync'

export function SyncButton() {
  const [state, action, pending] = useActionState(syncResults, undefined)

  return (
    <div className="flex items-center gap-3">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Buscando resultados…' : 'Sincronizar Resultados'}
        </button>
      </form>

      {state && 'error' in state && (
        <span className="text-sm text-red-600">{state.error}</span>
      )}

      {state && 'updated' in state && (
        <span className="text-sm text-zinc-600">
          {state.updated > 0
            ? `✓ ${state.updated} resultado${state.updated > 1 ? 's' : ''} atualizado${state.updated > 1 ? 's' : ''}`
            : state.notFinished > 0
              ? `${state.notFinished} jogo${state.notFinished > 1 ? 's' : ''} ainda em andamento na API`
              : 'Nenhum resultado novo'}
          {state.errors.length > 0 && ` · ${state.errors.length} erro(s)`}
        </span>
      )}
    </div>
  )
}
