import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../../lib/api-client'

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description: string | null
  currency: string
  created_at: string
  updated_at: string
}

export function usePortfolios() {
  return useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/portfolios')
      return data
    },
  })
}
