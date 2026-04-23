import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

import {
  useWatchlist,
  useAddWatchlistItem,
  useRemoveWatchlistItem,
} from '../shared/hooks/useWatchlist'
import ErrorAlert from '../shared/components/ErrorAlert'
import LoadingSpinner from '../shared/components/LoadingSpinner'
import EmptyState from '../shared/components/EmptyState'

function fmtUSD(val: string | null) {
  if (!val) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(val),
  )
}

function DistanceBadge({ pct }: { pct: string }) {
  const n = parseFloat(pct)
  const abs = Math.abs(n)
  const isClose = abs <= 5
  const isAbove = n > 0

  if (isClose) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-400/12 text-brand-700 dark:bg-brand-400/15 dark:text-brand-400">
        Cerca del objetivo
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${isAbove ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400'}`}
    >
      {isAbove ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isAbove ? '+' : ''}
      {n.toFixed(2)}%
    </span>
  )
}

export default function WatchlistPage() {
  const { data, isLoading } = useWatchlist()
  const addMutation = useAddWatchlistItem()
  const removeMutation = useRemoveWatchlistItem()

  const [ticker, setTicker] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [notes, setNotes] = useState('')

  const handleAdd = () => {
    const t = ticker.trim().toUpperCase()
    if (!t) return
    addMutation.mutate(
      {
        ticker: t,
        target_price: targetPrice.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTicker('')
          setTargetPrice('')
          setNotes('')
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Watchlist</h1>

      {/* Add form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-5 shadow-card">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Agregar ticker
        </p>
        <div className="flex flex-wrap gap-2.5 items-end">
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Ticker</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="AAPL"
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all uppercase placeholder:normal-case"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">
              Precio objetivo (USD)
            </label>
            <input
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="200.00"
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all"
            />
          </div>
          <div className="flex-[2] min-w-[180px]">
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Notas</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Por qué me interesa este activo..."
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!ticker.trim() || addMutation.isPending}
            className="flex items-center gap-1.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={15} strokeWidth={2.5} />
            Agregar
          </button>
        </div>
        {addMutation.isError && (
          <div className="mt-3">
            <ErrorAlert
              message={
                (addMutation.error as { response?: { data?: { error?: { message?: string } } } })
                  ?.response?.data?.error?.message ?? 'Error al agregar ticker'
              }
            />
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="Watchlist vacía"
          description="Agrega tickers que quieras monitorear antes de invertir."
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-50 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30">
                  <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                    Precio actual
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                    Precio objetivo
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                    Distancia
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Notas
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                          {item.ticker.slice(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.ticker}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {fmtUSD(item.current_price)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-gray-500 dark:text-gray-400">
                      {fmtUSD(item.target_price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.distance_pct ? (
                        <DistanceBadge pct={item.distance_pct} />
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-[220px] truncate">
                      {item.notes ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeMutation.mutate(item.ticker)}
                        disabled={removeMutation.isPending}
                        className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
