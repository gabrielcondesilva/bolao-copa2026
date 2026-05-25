'use client'

import { useState, useTransition } from 'react'
import { deleteParticipant } from '@/app/actions/participants'

export default function DeleteParticipantButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteParticipant(userId)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setOpen(true) }}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Excluir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-900">Excluir participante</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Tem certeza que deseja excluir <span className="font-medium text-zinc-900">{name}</span>?
              Todos os palpites serão apagados permanentemente.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
