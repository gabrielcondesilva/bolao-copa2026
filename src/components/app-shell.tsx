import Image from 'next/image'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { AppNav } from './app-nav'

interface Profile {
  name: string | null
  is_admin: boolean | null
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/jogos" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FIFA World Cup 2026" width={32} height={32} className="shrink-0" />
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-base font-extrabold tracking-tight text-zinc-900">Bolão</span>
              <span className="text-base font-extrabold tracking-tight text-green-700">Copa 2026</span>
            </div>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden max-w-[120px] truncate text-sm text-zinc-500 sm:block">
              {profile?.name}
            </span>
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-green-700 hover:text-green-800"
              >
                Admin
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-3xl border-t border-zinc-100 px-4 sm:px-6">
          <AppNav />
        </div>
      </header>
      {children}
    </div>
  )
}
