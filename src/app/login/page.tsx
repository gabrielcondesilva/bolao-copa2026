'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-2xl shadow-md">
            ⚽
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Bolão <span className="text-green-700">Copa 2026</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">FIFA World Cup 2026</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form action={action} className="flex flex-col gap-4">
            {state?.error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {state.error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-zinc-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <Link
          href="/login/recuperar-senha"
          className="mt-4 block text-center text-sm text-zinc-400 hover:text-zinc-600"
        >
          Esqueceu a senha?
        </Link>
      </div>
    </div>
  )
}
