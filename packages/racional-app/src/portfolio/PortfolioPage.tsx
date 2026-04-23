import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usePortfolios } from '../shared/hooks/usePortfolios'
import { usePortfolioTotal } from '../shared/hooks/usePortfolioTotal'
import { useUserBalance } from '../shared/hooks/useUserBalance'
import HoldingsTable from '../shared/components/HoldingsTable'
import EmptyState from '../shared/components/EmptyState'
import LoadingSpinner from '../shared/components/LoadingSpinner'
import { apiClient } from '../lib/api-client'

import EvolutionChart from './components/EvolutionChart'
import PlaceOrderModal from './components/PlaceOrderModal'
import CreatePortfolioModal from './components/CreatePortfolioModal'
import { useInvestmentEvolution } from './hooks/useInvestmentEvolution'

function fmtUsd(value: string | number, decimals?: number) {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(num)
}

export default function PortfolioPage() {
  const qc = useQueryClient()
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios()
  const { data: balance } = useUserBalance()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  const activeId = selectedId ?? portfolios?.[0]?.id
  const activePortfolio = portfolios?.find((p) => p.id === activeId)
  const { data: total, isLoading: totalLoading } = usePortfolioTotal(activeId)
  const {
    data: evolution,
    loading: evolutionLoading,
    error: evolutionError,
  } = useInvestmentEvolution()

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
      setIsEditingInfo(false)
    },
  })

  if (portfoliosLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!portfolios?.length) {
    return (
      <div>
        <EmptyState
          title="Sin portafolios"
          description="Crea tu primer portafolio para comenzar a registrar tus inversiones."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:shadow-accent-600/20"
            >
              Crear portafolio
            </button>
          }
        />
        {showCreate && <CreatePortfolioModal onClose={() => setShowCreate(false)} />}
      </div>
    )
  }

  const pnl = total ? parseFloat(total.total_pnl) : undefined
  const pnlPct = total ? parseFloat(total.total_pnl_pct) : undefined
  const isPnlPositive = pnl !== undefined && pnl >= 0

  const totalValue = total ? parseFloat(total.total_value) : undefined
  const totalPnlPct = pnlPct?.toFixed(2)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Portafolio</h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          {portfolios.length > 1 && (
            <div className="relative">
              <select
                value={activeId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl pl-3 pr-8 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all shadow-sm cursor-pointer"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
            </div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nuevo portafolio
          </button>
          <button
            onClick={() => setShowOrder(true)}
            className="flex items-center gap-1.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:shadow-accent-600/20"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nueva orden
          </button>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl px-6 py-5 flex items-center justify-between shadow-card-lg shadow-brand-400/20">
        <div>
          <p className="text-sm text-white/70 font-medium">Saldo disponible</p>
          <p className="mt-1 text-3xl font-bold text-white tracking-tight">
            {balance ? fmtUsd(balance.available_balance) : '—'}
            {balance && <span className="text-base font-medium text-white/60 ml-1.5">USD</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/80 font-medium">Para invertir</p>
          <p className="text-xs text-white/50 mt-0.5">Wallet global</p>
        </div>
      </div>

      {/* Portfolio summary + info card */}
      {totalLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 flex items-center justify-center h-32 shadow-card">
          <LoadingSpinner />
        </div>
      ) : total ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:divide-x sm:divide-slate-100 dark:sm:divide-gray-800">
            {/* Left: value */}
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Valor total del portafolio
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {fmtUsd(total.total_value)}
                </p>
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">USD</span>
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isPnlPositive
                      ? 'bg-brand-400/12 text-brand-700 dark:bg-brand-400/15 dark:text-brand-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  {isPnlPositive ? '+' : ''}
                  {fmtUsd(total.total_pnl)} ({isPnlPositive ? '+' : ''}
                  {pnlPct?.toFixed(2)}%)
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600">vs costo total</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Costo total</p>
                  <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {fmtUsd(total.total_cost)}{' '}
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                      USD
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Actualizado</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(total.calculated_at).toLocaleTimeString('es-CL')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: portfolio info */}
            {activePortfolio && (
              <div className="sm:pl-6 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Información del portafolio
                    </p>
                    {!isEditingInfo && (
                      <button
                        onClick={() => {
                          setEditingName(activePortfolio.name)
                          setEditingDesc(activePortfolio.description ?? '')
                          setIsEditingInfo(true)
                        }}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {isEditingInfo ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                          Nombre
                        </label>
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all text-sm placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">
                          Descripción
                        </label>
                        <input
                          value={editingDesc}
                          onChange={(e) => setEditingDesc(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all text-sm placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                          Nombre
                        </p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {activePortfolio.name}
                        </p>
                      </div>
                      {activePortfolio.description && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                            Descripción
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activePortfolio.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditingInfo && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                      className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => setIsEditingInfo(false)}
                      className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-2 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Evolution chart — only shown when portfolio has holdings */}
      {total && total.holdings.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Evolución</h3>
          {evolutionLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : evolutionError ? (
            <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400 text-sm">
              Error al cargar datos: {evolutionError}
            </div>
          ) : (
            <EvolutionChart
              data={evolution}
              currentValue={totalValue}
              pnlAmount={pnl}
              pnlPct={totalPnlPct}
            />
          )}
        </div>
      )}

      {total && total.holdings.length > 0 && evolution.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Valor actual',
              value: totalValue !== undefined ? fmtUsd(totalValue) : '—',
              unit: 'USD',
              positive: undefined,
            },
            {
              label: 'Retorno total',
              value:
                totalPnlPct !== undefined
                  ? `${parseFloat(totalPnlPct) >= 0 ? '+' : ''}${totalPnlPct}%`
                  : '—',
              unit: undefined,
              positive: totalPnlPct !== undefined ? parseFloat(totalPnlPct) >= 0 : undefined,
            },
            {
              label: 'Ganancias / Pérdidas',
              value: pnl !== undefined ? fmtUsd(pnl) : '—',
              unit: 'USD',
              positive: pnl !== undefined ? pnl >= 0 : undefined,
            },
            {
              label: 'Índice portafolio',
              value: evolution[evolution.length - 1].portfolioIndex.toFixed(2),
              unit: undefined,
              positive: undefined,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-4 shadow-card"
            >
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <p
                  className={`font-bold text-base ${
                    stat.positive === undefined
                      ? 'text-gray-900 dark:text-white'
                      : stat.positive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {stat.value}
                </p>
                {stat.unit && (
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    {stat.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Holdings */}
      {total && total.holdings.length > 0 && (
        <HoldingsTable holdings={total.holdings} totalValue={total.total_value} />
      )}

      {showCreate && <CreatePortfolioModal onClose={() => setShowCreate(false)} />}
      {showOrder && activeId && (
        <PlaceOrderModal portfolioId={activeId} onClose={() => setShowOrder(false)} />
      )}
    </div>
  )
}
