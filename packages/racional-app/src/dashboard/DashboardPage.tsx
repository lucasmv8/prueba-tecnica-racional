import { useState } from 'react'

import EmptyState from '../shared/components/EmptyState'
import LoadingSpinner from '../shared/components/LoadingSpinner'
import CreatePortfolioModal from '../portfolio/components/CreatePortfolioModal'

import HoldingsTable from './components/HoldingsTable'
import MovementsFeed from './components/MovementsFeed'
import PortfolioSummaryCard from './components/PortfolioSummaryCard'
import { useMovements } from './hooks/useMovements'
import { usePortfolioTotal } from './hooks/usePortfolioTotal'
import { usePortfolios } from './hooks/usePortfolios'
import { useUserBalance } from './hooks/useUserBalance'

function fmtUsd(value: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(value),
  )
}

export default function DashboardPage() {
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios()
  const { data: balance } = useUserBalance()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showCreate, setShowCreate] = useState(false)

  const activePortfolioId = selectedId ?? portfolios?.[0]?.id

  const { data: total, isLoading: totalLoading } = usePortfolioTotal(activePortfolioId)
  const { data: movementsData, isLoading: movementsLoading } = useMovements()

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-2.5">
          {portfolios.length > 1 && (
            <select
              value={activePortfolioId}
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
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
          >
            + Nuevo portafolio
          </button>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl px-6 py-5 flex items-center justify-between shadow-card-lg shadow-brand-400/20">
        <div>
          <p className="text-sm text-white/70 font-medium">Saldo disponible</p>
          <p className="mt-1 text-3xl font-bold text-white tracking-tight">
            {balance ? fmtUsd(balance.available_balance) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/80 font-medium">Para invertir</p>
          <p className="text-xs text-white/50 mt-0.5">Wallet global</p>
        </div>
      </div>

      <PortfolioSummaryCard total={total} loading={totalLoading} />

      {total && total.holdings.length > 0 && <HoldingsTable holdings={total.holdings} />}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
          Últimos movimientos
        </h3>
        {movementsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <MovementsFeed movements={movementsData?.items ?? []} />
        )}
      </div>

      {showCreate && <CreatePortfolioModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
