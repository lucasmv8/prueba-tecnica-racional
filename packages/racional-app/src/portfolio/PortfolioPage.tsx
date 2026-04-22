import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usePortfolios } from '../dashboard/hooks/usePortfolios'
import { usePortfolioTotal } from '../dashboard/hooks/usePortfolioTotal'
import HoldingsTable from '../dashboard/components/HoldingsTable'
import LoadingSpinner from '../shared/components/LoadingSpinner'
import { apiClient } from '../lib/api-client'

import PlaceOrderModal from './components/PlaceOrderModal'

export default function PortfolioPage() {
  const qc = useQueryClient()
  const { data: portfolios, isLoading } = usePortfolios()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showOrder, setShowOrder] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingDesc, setEditingDesc] = useState('')

  const activeId = selectedId ?? portfolios?.[0]?.id
  const activePortfolio = portfolios?.find((p) => p.id === activeId)
  const { data: total, isLoading: totalLoading } = usePortfolioTotal(activeId)

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/api/portfolios/${activeId}`, {
        name: editingName || undefined,
        description: editingDesc || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      setEditingName('')
      setEditingDesc('')
    },
  })

  if (isLoading)
    return (
      <div className="flex justify-center pt-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  if (!portfolios?.length || !activePortfolio) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Portafolio</h1>
        <button
          onClick={() => setShowOrder(true)}
          className="bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:shadow-accent-600/20"
        >
          + Nueva orden
        </button>
      </div>

      {portfolios.length > 1 && (
        <select
          value={activeId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all"
        >
          {portfolios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 space-y-4 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Información del portafolio
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">
              Nombre
            </label>
            <input
              defaultValue={activePortfolio.name}
              onChange={(e) => setEditingName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all text-sm placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">
              Descripción
            </label>
            <input
              defaultValue={activePortfolio.description ?? ''}
              onChange={(e) => setEditingDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all text-sm placeholder:text-slate-400"
            />
          </div>
        </div>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {totalLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : total ? (
        <HoldingsTable holdings={total.holdings} />
      ) : null}

      {showOrder && activeId && (
        <PlaceOrderModal portfolioId={activeId} onClose={() => setShowOrder(false)} />
      )}
    </div>
  )
}
