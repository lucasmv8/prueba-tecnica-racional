import LoadingSpinner from '../shared/components/LoadingSpinner'

import EvolutionChart from './components/EvolutionChart'
import { useInvestmentEvolution } from './hooks/useInvestmentEvolution'

export default function EvolutionPage() {
  const { data, loading, error } = useInvestmentEvolution()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Evolución del portafolio
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Datos en tiempo real desde Firestore
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400 text-sm">
            Error al cargar datos: {error}
          </div>
        ) : (
          <EvolutionChart data={data} />
        )}
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(() => {
            const first = data[0]
            const last = data[data.length - 1]
            const totalReturn = ((last.value - first.value) / first.value) * 100
            const isPositive = totalReturn >= 0
            const gains = last.value - last.contributions
            return [
              {
                label: 'Valor actual',
                value: new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(last.value),
                positive: undefined,
              },
              {
                label: 'Retorno total',
                value: `${isPositive ? '+' : ''}${totalReturn.toFixed(2)}%`,
                positive: isPositive,
              },
              {
                label: 'Ganancias / Pérdidas',
                value: new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(gains),
                positive: gains >= 0,
              },
              {
                label: 'Índice portafolio',
                value: last.portfolioIndex.toFixed(2),
                positive: undefined,
              },
            ]
          })().map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-4 shadow-card"
            >
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <p
                className={`mt-1.5 font-bold text-base ${
                  stat.positive === undefined
                    ? 'text-gray-900 dark:text-white'
                    : stat.positive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-red-500 dark:text-red-400'
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
