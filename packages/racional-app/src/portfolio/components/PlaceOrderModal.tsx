import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { apiClient } from '../../lib/api-client'
import ErrorAlert from '../../shared/components/ErrorAlert'

interface StockResult {
  ticker: string
  name: string
  exchange?: string
  current_price?: string | null
}

interface Props {
  portfolioId: string
  onClose: () => void
}

function fmt(price: string | null | undefined) {
  if (!price) return null
  const n = parseFloat(price)
  return isNaN(n) ? null : `$${n.toFixed(2)}`
}

export default function PlaceOrderModal({ portfolioId, onClose }: Props) {
  const qc = useQueryClient()
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY')
  const [tickerQuery, setTickerQuery] = useState('')
  const [selectedTicker, setSelectedTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: popularStocks } = useQuery<StockResult[]>({
    queryKey: ['stocks-popular'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/stocks/popular')
      return data
    },
    staleTime: 5 * 60_000,
  })

  const { data: searchResults } = useQuery<StockResult[]>({
    queryKey: ['stocks-search', tickerQuery],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/stocks/search?q=${tickerQuery}`)
      return data
    },
    enabled: tickerQuery.length >= 2,
  })

  const displayList: StockResult[] =
    tickerQuery.length >= 2 ? (searchResults ?? []) : (popularStocks ?? [])

  const totalAmount =
    quantity && pricePerUnit
      ? (parseFloat(quantity) * parseFloat(pricePerUnit)).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })
      : '-'

  function selectStock(stock: StockResult) {
    setSelectedTicker(stock.ticker)
    setTickerQuery(stock.ticker)
    if (stock.current_price) setPricePerUnit(parseFloat(stock.current_price).toFixed(2))
    setShowDropdown(false)
  }

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/api/portfolios/${portfolioId}/orders`, {
        type,
        ticker: selectedTicker || tickerQuery.toUpperCase(),
        quantity,
        price_per_unit: pricePerUnit,
        date: new Date(date).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-total'] })
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['user-balance'] })
      onClose()
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      setError(err.response?.data?.error?.message ?? 'Error al procesar orden')
    },
  })

  const inputClass =
    'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 w-full max-w-md shadow-modal">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Nueva orden</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl">
            {(['BUY', 'SELL'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  type === t
                    ? t === 'BUY'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t === 'BUY' ? 'Comprar' : 'Vender'}
              </button>
            ))}
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Acción
              {!selectedTicker && tickerQuery.length < 2 && (
                <span className="ml-1 text-gray-400 font-normal">(busca por símbolo)</span>
              )}
            </label>
            <input
              value={tickerQuery}
              onChange={(e) => {
                setTickerQuery(e.target.value)
                setSelectedTicker('')
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              required
              className={`${inputClass} uppercase`}
              placeholder="AAPL, MSFT, TSLA..."
            />
            {showDropdown && displayList.length > 0 && !selectedTicker && (
              <div className="absolute z-10 mt-1.5 w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-card-lg max-h-52 overflow-y-auto">
                {tickerQuery.length < 2 && (
                  <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 border-b border-slate-100 dark:border-gray-700 font-medium">
                    Acciones populares
                  </p>
                )}
                {displayList.slice(0, 10).map((s) => (
                  <button
                    key={s.ticker}
                    type="button"
                    onClick={() => selectStock(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {s.ticker}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 truncate">
                        {s.name}
                      </span>
                    </div>
                    {fmt(s.current_price) && (
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-medium ml-2 shrink-0 tabular-nums">
                        {fmt(s.current_price)} <span className="font-normal opacity-70">USD</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Cantidad
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className={inputClass}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Precio / unidad (USD)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                required
                className={inputClass}
                placeholder="175.50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Fecha
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center border border-slate-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total estimado
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-gray-900 dark:text-white text-sm tabular-nums">
                {totalAmount}
              </span>
              {totalAmount !== '-' && (
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">USD</span>
              )}
            </div>
          </div>

          {error && <ErrorAlert message={error} />}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-2.5 rounded-xl transition-all duration-200 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`flex-1 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md ${
                type === 'BUY'
                  ? 'bg-brand-500 hover:bg-brand-600 hover:shadow-brand-400/20'
                  : 'bg-red-500 hover:bg-red-600 hover:shadow-red-400/20'
              }`}
            >
              {mutation.isPending
                ? 'Procesando...'
                : type === 'BUY'
                  ? 'Confirmar compra'
                  : 'Confirmar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
