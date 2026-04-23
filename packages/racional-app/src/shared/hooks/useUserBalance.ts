import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../../lib/api-client'

export function useUserBalance() {
  return useQuery<{ available_balance: string }>({
    queryKey: ['user-balance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/users/me/balance')
      return data
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
