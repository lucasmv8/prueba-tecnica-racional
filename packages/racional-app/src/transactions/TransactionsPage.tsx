import { useState } from 'react'

import { useMovements } from '../dashboard/hooks/useMovements'
import MovementsFeed from '../dashboard/components/MovementsFeed'
import LoadingSpinner from '../shared/components/LoadingSpinner'

import RegisterTransactionModal from './components/RegisterTransactionModal'

export default function TransactionsPage() {
  const [showModal, setShowModal] = useState(false)
  const { data: movementsData, isLoading } = useMovements()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:shadow-accent-600/20"
        >
          + Nueva transacción
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Historial de movimientos
        </h3>
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
