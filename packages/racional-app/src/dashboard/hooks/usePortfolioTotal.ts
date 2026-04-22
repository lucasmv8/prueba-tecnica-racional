import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../../lib/api-client'

export interface HoldingWithPrice {
  stock_id: string
  ticker: string
  name: string
  quantity: string
  average_cost: string
  current_price: string
  market_value: string
  pnl: string
  pnl_pct: string
}

export interface PortfolioTotal {
  portfolio_id: string
  currency: string
  total_value: string
  total_cost: string
  total_pnl: string
  total_pnl_pct: string
  holdings: HoldingWithPrice[]
  calculated_at: string
  // cash_balance removed — wallet balance lives at user level (GET /users/me/balance)
}

export function usePortfolioTotal(portfolioId: string | undefined) {
  return useQuery<PortfolioTotal>({
    queryKey: ['portfolio-total', portfolioId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/portfolios/${portfolioId}/total`)
      return data
    },
    enabled: !!portfolioId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
