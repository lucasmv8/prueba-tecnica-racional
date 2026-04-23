import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../../lib/api-client'

export interface WatchlistItem {
  id: string
  ticker: string
  notes: string | null
  target_price: string | null
  current_price: string | null
  distance_pct: string | null
}

export function useWatchlist() {
  return useQuery<{ items: WatchlistItem[] }>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/watchlist')
      return data
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useAddWatchlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { ticker: string; notes?: string; target_price?: string }) =>
      apiClient.post('/api/watchlist', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })
}

export function useRemoveWatchlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticker: string) => apiClient.delete(`/api/watchlist/${ticker}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })
}
