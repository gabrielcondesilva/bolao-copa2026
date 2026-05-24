'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/jogos',        label: 'Jogos' },
  { href: '/classificacao', label: 'Classificação' },
  { href: '/palpites',     label: 'Palpites' },
  { href: '/ranking',      label: 'Ranking' },
]

export function AppNav() {
  const pathname = usePathname()
  return (
    <nav className="-mb-px flex gap-0" aria-label="Navegação principal">
      {TABS.map(tab => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              active
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
