import type { PortfolioTotal } from '../hooks/usePortfolioTotal'
import LoadingSpinner from '../../shared/components/LoadingSpinner'

interface Props {
  total: PortfolioTotal | undefined
  loading: boolean
}

function fmt(value: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(value),
  )
}

export default function PortfolioSummaryCard({ total, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 flex items-center justify-center h-32 shadow-card">
        <LoadingSpinner />
      </div>
    )
  }

  if (!total) return null

  const pnl = parseFloat(total.total_pnl)
  const pnlPct = parseFloat(total.total_pnl_pct)
  const isPositive = pnl >= 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        Valor total del portafolio
      </p>
      <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
        {fmt(total.total_value)}
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPositive
              ? 'bg-brand-400/12 text-brand-700 dark:bg-brand-400/15 dark:text-brand-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {fmt(total.total_pnl)} ({isPositive ? '+' : ''}
          {pnlPct.toFixed(2)}%)
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-600">vs costo total</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Costo total</p>
          <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {fmt(total.total_cost)}
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
  )
}
