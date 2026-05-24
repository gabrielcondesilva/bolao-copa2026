'use client'

import { useActionState, useState } from 'react'
import { updateMatchResult } from '@/app/actions/matches'

interface Props {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  wentToExtraTime: boolean
  isKnockout: boolean
}

export function MatchForm({ matchId, homeScore, awayScore, wentToExtraTime, isKnockout }: Props) {
  const [state, action, pending] = useActionState(updateMatchResult, undefined)
  const [extraTime, setExtraTime] = useState(wentToExtraTime)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />

      <input
        name="homeScore"
        type="number"
        min="0"
        max="99"
        defaultValue={homeScore ?? ''}
        required
        className="w-14 rounded border border-zinc-300 px-2 py-1 text-center text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
      />
      <span className="text-zinc-400 text-sm">×</span>
      <input
        name="awayScore"
        type="number"
        min="0"
        max="99"
        defaultValue={awayScore ?? ''}
        required
        className="w-14 rounded border border-zinc-300 px-2 py-1 text-center text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
      />

      {isKnockout && (
        <label className="flex items-center gap-1 text-xs text-zinc-500 cursor-pointer select-none">
          <input
            name="wentToExtraTime"
            type="checkbox"
            checked={extraTime}
            onChange={e => setExtraTime(e.target.checked)}
            className="rounded"
          />
          Prorrogação
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
      >
        {pending ? '…' : 'Salvar'}
      </button>

      {state && 'error' in state && (
        <span className="text-xs text-red-600">{state.error}</span>
      )}
      {state && 'success' in state && (
        <span className="text-xs text-green-600">✓ Salvo</span>
      )}
    </form>
  )
}
