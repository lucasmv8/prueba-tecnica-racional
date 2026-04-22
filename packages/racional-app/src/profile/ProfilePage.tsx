import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'
import { apiClient } from '../lib/api-client'
import LoadingSpinner from '../shared/components/LoadingSpinner'

interface UserProfile {
  id: string
  full_name: string
  phone: string | null
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/api/users/me')
      setFullName(data.full_name)
      setPhone(data.phone ?? '')
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch('/api/users/me', {
        full_name: fullName || undefined,
        phone: phone || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (isLoading)
    return (
      <div className="flex justify-center pt-16">
        <LoadingSpinner size="lg" />
      </div>
    )

  const initial = user?.email?.[0].toUpperCase() ?? '?'

  const inputClass =
    'w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/25 focus:border-brand-400 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500'

  return (
    <div className="space-y-5 max-w-lg">
      {/* Avatar + header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-400/25 shrink-0">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile?.full_name || 'Perfil'}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
          Información personal
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nombre completo
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder={profile?.full_name}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Teléfono
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+56 9 1234 5678"
            />
          </div>

          {success && (
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">
              Perfil actualizado correctamente
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:shadow-accent-600/20"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Cuenta</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
          Cierra la sesión en este dispositivo.
        </p>
        <button
          onClick={handleSignOut}
          className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium px-5 py-2.5 rounded-xl transition-all duration-200 text-sm border border-red-100 dark:border-red-800/40"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
