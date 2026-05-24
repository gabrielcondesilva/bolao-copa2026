'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/actions/auth'

export default function AlterarSenhaPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900">
          Defina sua senha
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500">
          Escolha uma senha para acessar o bolão.
        </p>

        <form action={action} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirm" className="text-sm font-medium text-zinc-700">
              Confirmar senha
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {pending ? 'Salvando…' : 'Salvar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
