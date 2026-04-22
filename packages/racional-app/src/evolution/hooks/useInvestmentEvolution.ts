import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '../../lib/firebase'

export interface EvolutionPoint {
  date: string
  value: number
  dailyReturn: number
  contributions: number
  portfolioIndex: number
}

interface FirestoreTimestamp {
  seconds: number
  nanoseconds: number
}

interface RawEvolutionEntry {
  date: FirestoreTimestamp | { seconds: number; nanoseconds: number }
  portfolioValue: number
  dailyReturn: number
  contributions: number
  portfolioIndex: number
}

interface UseInvestmentEvolutionResult {
  data: EvolutionPoint[]
  loading: boolean
  error: string | null
}

function toISODate(ts: FirestoreTimestamp): string {
  return new Date(ts.seconds * 1000).toISOString().slice(0, 10)
}

export function useInvestmentEvolution(): UseInvestmentEvolutionResult {
  const [data, setData] = useState<EvolutionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ref = doc(db, 'investmentEvolutions', 'user1')

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          setData([])
          setLoading(false)
          return
        }

        const raw = snapshot.data() as { array: RawEvolutionEntry[] }
        const entries = Array.isArray(raw.array) ? raw.array : []

        const points: EvolutionPoint[] = entries
          .filter((e) => e.date?.seconds != null && typeof e.portfolioValue === 'number')
          .map((e) => ({
            date: toISODate(e.date as FirestoreTimestamp),
            value: e.portfolioValue,
            dailyReturn: e.dailyReturn ?? 0,
            contributions: e.contributions ?? 0,
            portfolioIndex: e.portfolioIndex ?? 100,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setData(points)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { data, loading, error }
}
