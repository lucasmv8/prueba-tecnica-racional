import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../../lib/api-client'

export interface Movement {
  id: string
  kind: 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL'
  amount: string
  date: string
  description: string | null
  ticker: string | null
  quantity: string | null
}

export type MovementKind = 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL'

export function useMovements(limit = 20, kind?: MovementKind) {
  return useQuery<{ items: Movement[]; next_cursor: string | null }>({
    queryKey: ['movements', limit, kind],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (kind) params.set('kind', kind)
      const { data } = await apiClient.get(`/api/movements?${params.toString()}`)
      return data
    },
  })
}
