export interface Portfolio {
  id: string
  user_id: string
  name: string
  description: string | null
  currency: string
  created_at: Date
  updated_at: Date
}

export interface CreatePortfolioProps {
  user_id: string
  name: string
  description?: string
  currency?: string
}

export interface UpdatePortfolioProps {
  name?: string
  description?: string | null
  currency?: string
}
