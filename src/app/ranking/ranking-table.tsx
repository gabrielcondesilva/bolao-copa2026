'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { RankingEntry } from '@/lib/ranking'

export function RankingTable({ entries }: { entries: RankingEntry[] }) {
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    const channel = client
      .channel('ranking-matches')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        () => { router.refresh() },
      )
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [router])

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Nenhum participante encontrado.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="w-12 px-4 py-3">#</th>
            <th className="px-4 py-3">Participante</th>
            <th className="px-3 py-3 text-right font-bold">Pts</th>
            <th className="hidden px-3 py-3 text-right sm:table-cell">Cravados</th>
            <th className="hidden px-4 py-3 text-right sm:table-cell">Resultados</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {entries.map(entry => (
            <tr
              key={entry.userId}
              className={`transition-colors hover:bg-zinc-50 ${
                entry.position === 1 ? 'bg-amber-50/60' :
                entry.position === 2 ? 'bg-zinc-50/60' :
                entry.position === 3 ? 'bg-orange-50/40' : ''
              }`}
            >
              <td className="px-4 py-3">
                <Medal position={entry.position} />
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-900">
                <Link
                  href={`/ranking/${entry.userId}`}
                  className="hover:text-green-700 hover:underline"
                >
                  {entry.name}
                </Link>
              </td>
              <td className="px-3 py-3 text-right">
                <span className="text-base font-black tabular-nums text-zinc-900">
                  {entry.totalPoints}
                </span>
              </td>
              <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-500 sm:table-cell">
                {entry.exactScores}
              </td>
              <td className="hidden px-4 py-3 text-right tabular-nums text-zinc-500 sm:table-cell">
                {entry.correctResults}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Medal({ position }: { position: number }) {
  if (position === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-white shadow-sm">
        1
      </span>
    )
  }
  if (position === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-300 text-xs font-black text-zinc-700 shadow-sm">
        2
      </span>
    )
  }
  if (position === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-black text-white shadow-sm">
        3
      </span>
    )
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-xs font-medium text-zinc-400">
      {position}
    </span>
  )
}
