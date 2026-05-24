'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createParticipant } from '@/app/actions/auth'

export default function NovoParticipantePage() {
  const [state, action, pending] = useActionState(createParticipant, undefined)

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-zinc-900">
          Novo participante
        </h1>

        <form action={action} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="off"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Senha temporária
            </label>
            <input
              id="password"
              name="password"
              type="text"
              required
              autoComplete="off"
              placeholder="Participante precisará trocar no primeiro acesso"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {pending ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </form>

        <Link
          href="/admin"
          className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          ← Voltar
        </Link>
      </div>
    </div>
  )
}
