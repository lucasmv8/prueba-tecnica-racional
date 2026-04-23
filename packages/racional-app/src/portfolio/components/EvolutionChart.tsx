import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { EvolutionPoint } from '../hooks/useInvestmentEvolution'

interface Props {
  data: EvolutionPoint[]
  currentValue?: number
  pnlAmount?: number
  pnlPct?: string
}

const BRAND_TEAL = '#65d6b0'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
}

interface TooltipPayloadEntry {
  value: number
  payload: EvolutionPoint & { formattedDate: string }
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  const isPositive = entry.dailyReturn >= 0
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-card-lg min-w-[160px]">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {formatCurrency(payload[0].value)}{' '}
        <span className="text-xs font-normal text-gray-400">USD</span>
      </p>
      <p
        className={`text-xs mt-1 font-medium ${isPositive ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}
      >
        {isPositive ? '+' : ''}
        {(entry.dailyReturn * 100).toFixed(2)}% día
      </p>
      <p className="text-xs text-gray-400 mt-1">Índice: {entry.portfolioIndex.toFixed(2)}</p>
    </div>
  )
}

export default function EvolutionChart({ data, currentValue, pnlAmount, pnlPct }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
        Sin datos de evolución
      </div>
    )
  }

  const chartData = data.map((p) => ({ ...p, formattedDate: formatDate(p.date) }))
  const minVal = Math.min(...data.map((p) => p.value)) * 0.98
  const maxVal = Math.max(...data.map((p) => p.value)) * 1.02

  const displayValue = currentValue ?? data[data.length - 1]?.value ?? 0
  const displayPnl = pnlAmount ?? 0
  const displayPnlPct = pnlPct ?? '0.00'
  const isPositive = displayPnl >= 0

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(displayValue)}
            </p>
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">USD</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Valor actual del portafolio
          </p>
        </div>
        <span
          className={`mb-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPositive
              ? 'bg-brand-400/12 text-brand-700 dark:bg-brand-400/15 dark:text-brand-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {formatCurrency(displayPnl)} ({isPositive ? '+' : ''}
          {displayPnlPct}%)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BRAND_TEAL} stopOpacity={0.25} />
              <stop offset="95%" stopColor={BRAND_TEAL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            className="dark:[stroke:#1f2937]"
            vertical={false}
          />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k USD`}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={BRAND_TEAL}
            strokeWidth={2.5}
            fill="url(#portfolioGradient)"
            dot={false}
            activeDot={{ r: 5, fill: BRAND_TEAL, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
