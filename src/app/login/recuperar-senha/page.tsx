'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions/auth'

export default function RecuperarSenhaPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900">
          Recuperar senha
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500">
          Enviaremos um link para redefinir sua senha.
        </p>

        {state?.success ? (
          <div className="rounded-md bg-green-50 px-4 py-4 text-sm text-green-800">
            Link enviado! Verifique seu e-mail.
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            {state?.error && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {pending ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          ← Voltar ao login
        </Link>
      </div>
    </div>
  )
}
