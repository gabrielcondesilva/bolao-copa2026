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
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400">
        Nenhum participante encontrado.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3 w-10">#</th>
            <th className="px-4 py-3">Participante</th>
            <th className="px-4 py-3 text-right">Pontos</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Cravados</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Resultados</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {entries.map((entry, i) => {
            const isTop3 = entry.position <= 3
            return (
              <tr
                key={entry.userId}
                className={`${isTop3 ? 'bg-green-50/40' : ''} ${i % 2 === 0 ? '' : 'bg-zinc-50/40'}`}
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      entry.position === 1
                        ? 'bg-amber-400 text-white'
                        : entry.position === 2
                        ? 'bg-zinc-300 text-zinc-700'
                        : entry.position === 3
                        ? 'bg-amber-700 text-white'
                        : 'text-zinc-400'
                    }`}
                  >
                    {entry.position}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  <Link href={`/ranking/${entry.userId}`} className="hover:text-green-700 hover:underline">
                    {entry.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900">{entry.totalPoints}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-600">{entry.exactScores}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-600">{entry.correctResults}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
