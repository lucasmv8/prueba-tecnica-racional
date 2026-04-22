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

export function useMovements(limit = 20) {
  return useQuery<{ items: Movement[]; next_cursor: string | null }>({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/movements?limit=${limit}`)
      return data
    },
  })
}
