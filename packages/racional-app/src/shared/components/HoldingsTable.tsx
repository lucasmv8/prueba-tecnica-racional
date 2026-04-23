import type { HoldingWithPrice } from '../hooks/usePortfolioTotal'

interface Props {
  holdings: HoldingWithPrice[]
  totalValue: string
}

function fmtUSD(val: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    parseFloat(val),
  )
}

function fmtQty(val: string) {
  return parseFloat(val).toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function HoldingsTable({ holdings, totalValue }: Props) {
  const active = holdings.filter((h) => parseFloat(h.quantity) > 0)

  if (active.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 text-center text-sm text-gray-400 shadow-card">
        Sin posiciones abiertas
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden shadow-card">
      <div className="px-6 py-4 border-b border-slate-50 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Posiciones</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-50 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30">
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Activo
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                Cantidad
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                Break-even
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                Precio (USD)
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                Valor (USD)
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                % Portafolio
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">
                P&L
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
            {active.map((h) => {
              const pnl = parseFloat(h.pnl)
              const pnlPct = parseFloat(h.pnl_pct)
              const isPos = pnl >= 0
              const portfolioPct =
                parseFloat(totalValue) > 0
                  ? ((parseFloat(h.market_value) / parseFloat(totalValue)) * 100).toFixed(1)
                  : '0.0'
              return (
                <tr
                  key={h.stock_id}
                  className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                        {h.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {h.ticker}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                          {h.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                    {fmtQty(h.quantity)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-400 dark:text-gray-500 tabular-nums">
                    {fmtUSD(h.average_cost)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                    {fmtUSD(h.current_price)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {fmtUSD(h.market_value)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                    {portfolioPct}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-sm font-semibold tabular-nums ${isPos ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}
                    >
                      {isPos ? '+' : ''}
                      {pnlPct.toFixed(2)}%
                    </span>
                    <p
                      className={`text-xs tabular-nums ${isPos ? 'text-brand-500 dark:text-brand-500' : 'text-red-400 dark:text-red-500'}`}
                    >
                      {isPos ? '+' : ''}
                      {fmtUSD(h.pnl)}
                    </p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
