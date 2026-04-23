import { useState } from 'react'
import { Plus } from 'lucide-react'

import { useMovements, type MovementKind } from '../shared/hooks/useMovements'
import MovementsFeed from '../shared/components/MovementsFeed'
import LoadingSpinner from '../shared/components/LoadingSpinner'

import RegisterTransactionModal from './components/RegisterTransactionModal'

type Filter = 'ALL' | MovementKind

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'WITHDRAWAL', label: 'Retiro' },
  { value: 'BUY', label: 'Compra' },
  { value: 'SELL', label: 'Venta' },
]

export default function TransactionsPage() {
  const [showModal, setShowModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL')

  const { data: movementsData, isLoading } = useMovements(
    20,
    activeFilter === 'ALL' ? undefined : activeFilter,
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:shadow-accent-600/20"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nueva transacción
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Historial de movimientos
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  activeFilter === f.value
                    ? 'bg-brand-400/12 text-brand-700 dark:bg-brand-400/15 dark:text-brand-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <MovementsFeed movements={movementsData?.items ?? []} />
        )}
      </div>

      {showModal && <RegisterTransactionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
