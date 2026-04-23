import type { Movement } from '../hooks/useMovements'

interface Props {
  movements: Movement[]
}

const kindConfig = {
  DEPOSIT: {
    label: 'Depósito',
    color: 'text-brand-700 dark:text-brand-400',
    bg: 'bg-brand-400/10 dark:bg-brand-400/10',
    sign: '+',
  },
  WITHDRAWAL: {
    label: 'Retiro',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    sign: '-',
  },
  BUY: {
    label: 'Compra',
    color: 'text-accent-700 dark:text-accent-400',
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    sign: '-',
  },
  SELL: {
    label: 'Venta',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    sign: '+',
  },
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtUSD(amount: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(amount),
  )
}

export default function MovementsFeed({ movements }: Props) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        Sin movimientos registrados
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {movements.map((m) => {
        const config = kindConfig[m.kind]
        return (
          <div
            key={m.id}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${config.bg} ${config.color}`}
            >
              {config.label}
            </span>
            <div className="flex-1 min-w-0">
              {m.ticker ? (
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {m.ticker} × {parseFloat(m.quantity ?? '0').toLocaleString()}
                </p>
              ) : (
                <p className="text-sm text-gray-900 dark:text-white">
                  {m.description ?? config.label}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(m.date)}</p>
            </div>
            <p className={`font-semibold text-sm tabular-nums ${config.color}`}>
              {config.sign}
              {fmtUSD(m.amount)} <span className="text-xs font-normal opacity-60">USD</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
