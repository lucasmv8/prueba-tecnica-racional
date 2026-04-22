export interface User {
  id: string
  full_name: string
  phone: string | null
  created_at: Date
  updated_at: Date
}

export interface UpdateUserInfoProps {
  full_name?: string
  phone?: string | null
}
