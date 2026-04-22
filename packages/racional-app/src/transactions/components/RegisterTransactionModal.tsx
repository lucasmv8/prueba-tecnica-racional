import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { apiClient } from '../../lib/api-client'

interface Props {
  onClose: () => void
}

export default function RegisterTransactionModal({ onClose }: Props) {
  const qc = useQueryClient()
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/transactions', {
        type,
        amount,
        date: new Date(date).toISOString(),
        description: description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['user-balance'] })
      onClose()
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      setError(err.response?.data?.error?.message ?? 'Error al registrar transacción')
    },
  })

  const inputClass =
    'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 w-full max-w-md shadow-modal">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Nueva transacción</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl">
            {(['DEPOSIT', 'WITHDRAWAL'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  type === t
                    ? t === 'DEPOSIT'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t === 'DEPOSIT' ? 'Depósito' : 'Retiro'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Monto (USD) *
            </label>
            <input
              type="number"
              step="any"
              min="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={inputClass}
              placeholder="1,000.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Fecha *
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Descripción
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Descripción opcional"
            />
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-2.5 rounded-xl transition-all duration-200 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`flex-1 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md ${
                type === 'DEPOSIT'
                  ? 'bg-brand-500 hover:bg-brand-600 hover:shadow-brand-400/20'
                  : 'bg-red-500 hover:bg-red-600 hover:shadow-red-400/20'
              }`}
            >
              {mutation.isPending ? 'Registrando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
